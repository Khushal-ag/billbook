import { useState, useCallback } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ProductDialog from "@/components/dialogs/ProductDialog";
import StockAdjustmentDialog from "@/components/dialogs/StockAdjustmentDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  ProductsTable,
  StockReportTab,
  ProductDetailView,
} from "@/components/products/ProductSections";
import { useProducts, useDeleteProduct } from "@/hooks/use-products";
import { usePermissions } from "@/hooks/use-permissions";
import { useDebounce } from "@/hooks/use-debounce";
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

  const openCreate = useCallback(() => {
    setEditProduct(undefined);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((p: Product) => {
    setEditProduct(p);
    setDialogOpen(true);
  }, []);

  const openStockAdjust = useCallback((p: Product) => {
    setStockProduct({ id: p.id, name: p.name });
    setStockDialogOpen(true);
  }, []);

  const handleDelete = useCallback((p: Product) => {
    setDeleteConfirm({ open: true, product: p });
  }, []);

  const confirmDelete = useCallback(() => {
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
  }, [deleteConfirm.product, deleteMutation]);

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
        <TabsList className="mb-4 w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="stock-report">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="mb-4 w-full sm:max-w-sm"
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
            <ProductsTable
              products={filtered}
              isOwner={isOwner}
              deletePending={deleteMutation.isPending}
              onEdit={openEdit}
              onStockAdjust={openStockAdjust}
              onDelete={handleDelete}
              onSelectDetail={setDetailId}
            />
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
