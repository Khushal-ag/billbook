import { useState } from "react";
import { Plus, Package, Pencil, Trash2, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ProductDialog from "@/components/dialogs/ProductDialog";
import StockAdjustmentDialog from "@/components/dialogs/StockAdjustmentDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useProducts,
  useProduct,
  useDeleteProduct,
  useStockLedger,
  useStockReport,
} from "@/hooks/use-products";
import { usePermissions } from "@/hooks/use-permissions";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function Products() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<{ id: number; name: string } | null>(null);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  const { isOwner } = usePermissions();
  const { data, isPending, error } = useProducts();
  const deleteMutation = useDeleteProduct();

  const products = data?.products ?? [];
  const filtered = products.filter(
    (p) =>
      !p.deletedAt &&
      (!debouncedSearch || p.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
  );

  const openCreate = () => {
    setEditProduct(undefined);
    setDialogOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditProduct(p);
    setDialogOpen(true);
  };
  const openStockAdjust = (p: Product) => {
    setStockProduct({ id: p.id, name: p.name });
    setStockDialogOpen(true);
  };

  const handleDelete = (p: Product) => {
    setDeleteConfirm({ open: true, product: p });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.product) return;
    deleteMutation.mutate(deleteConfirm.product.id, {
      onSuccess: () => {
        showSuccessToast("Product deleted");
        setDeleteConfirm({ open: false, product: null });
      },
      onError: (err) => {
        showErrorToast(err, "Failed to delete");
        setDeleteConfirm({ open: false, product: null });
      },
    });
  };

  // If viewing a product detail (stock ledger)
  if (detailId) {
    return <ProductDetailView id={detailId} onBack={() => setDetailId(undefined)} />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Products & Services"
        description="Manage your inventory and service catalog"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <Tabs defaultValue="catalog">
        <TabsList className="mb-4">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="stock-report">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="mb-4 max-w-sm"
          />

          <ErrorBanner error={error} fallbackMessage="Failed to load products" />

          {isPending ? (
            <TableSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="No products found"
              description="Add your first product or service to start creating invoices."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              }
            />
          ) : (
            <div className="data-table-container">
              <table
                className="w-full text-sm"
                role="table"
                aria-label="Products and services list"
              >
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th
                      scope="col"
                      className="px-6 py-3 text-left font-medium text-muted-foreground"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left font-medium text-muted-foreground"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left font-medium text-muted-foreground"
                    >
                      HSN/SAC
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right font-medium text-muted-foreground"
                    >
                      Selling Price
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right font-medium text-muted-foreground"
                    >
                      Stock
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-right font-medium text-muted-foreground"
                    >
                      GST
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center font-medium text-muted-foreground"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20"
                      onClick={() => setDetailId(p.id)}
                    >
                      <td className="px-6 py-3 font-medium">{p.name}</td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {p.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {p.hsnCode || p.sacCode || "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {formatCurrency(p.sellingPrice ?? "0")}
                      </td>
                      <td className="px-3 py-3 text-right">{p.type === "SERVICE" ? "N/A" : "—"}</td>
                      <td className="px-3 py-3 text-right">{p.igstRate ?? "0"}%</td>
                      <td className="px-3 py-3 text-center">
                        <div
                          className="flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(p)}
                            title="Edit"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {p.type === "STOCK" && isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStockAdjust(p)}
                              title="Adjust Stock"
                              aria-label={`Adjust stock for ${p.name}`}
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(p)}
                              disabled={deleteMutation.isPending}
                              title="Delete"
                              aria-label={`Delete ${p.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock-report">
          <StockReportTab />
        </TabsContent>
      </Tabs>

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={editProduct} />

      {stockProduct && (
        <StockAdjustmentDialog
          open={stockDialogOpen}
          onOpenChange={setStockDialogOpen}
          productId={stockProduct.id}
          productName={stockProduct.name}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, product: deleteConfirm.product })}
        onConfirm={confirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteConfirm.product?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}

/* ─── Stock Report Tab ─── */
function StockReportTab() {
  const { data, isPending, error } = useStockReport();

  if (isPending) return <TableSkeleton rows={4} />;
  if (error) return <ErrorBanner error={error} fallbackMessage="Failed to load stock report" />;

  const items = (Array.isArray(data) ? data : []) as Array<{
    productId: number;
    productName: string;
    currentStock: number;
  }>;

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No stock report data available.
      </p>
    );
  }

  return (
    <div className="data-table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Product</th>
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">
              Current Stock
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-6 py-3 font-medium">{item.productName}</td>
              <td className="px-6 py-3 text-right">{item.currentStock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Product Detail (Stock Ledger) ─── */
function ProductDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: product, isPending: productPending } = useProduct(id);
  const { data: ledger, isPending: ledgerPending } = useStockLedger(id);
  const isPending = productPending || ledgerPending;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </button>
      </div>

      {isPending ? (
        <TableSkeleton rows={4} />
      ) : !product ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Product not found.</p>
      ) : (
        <>
          <PageHeader
            title={product.name}
            description={`${product.type} — Unit: ${product.unit || "—"}`}
          />

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Current Stock</p>
                <p className="mt-1 text-lg font-semibold">{product.currentStock}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.sellingPrice ?? "0")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Purchase Price</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.purchasePrice ?? "0")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">HSN/SAC</p>
                <p className="mt-1 text-lg font-semibold">
                  {product.hsnCode || product.sacCode || "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock Ledger
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ledger || ledger.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No stock movements yet.
                </p>
              ) : (
                <div className="data-table-container">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((m) => (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary" className="text-xs">
                              {m.movementType}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{m.quantity}</td>
                          <td className="px-3 py-2 text-muted-foreground">{m.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
