import { useState } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/TableSkeleton";
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useProducts();

  const products = data?.data || [];
  const filtered = products.filter(
    (p) =>
      !p.deletedAt &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Products & Services"
        description="Manage your inventory and service catalog"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search products..."
        className="max-w-sm mb-4"
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load products" />

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No products found"
          description="Add your first product or service to start creating invoices."
          action={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          }
        />
      ) : (
        <div className="data-table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-6 py-3">
                  Name
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3">
                  Type
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3">
                  HSN/SAC
                </th>
                <th className="text-right font-medium text-muted-foreground px-3 py-3">
                  Selling Price
                </th>
                <th className="text-right font-medium text-muted-foreground px-3 py-3">
                  Stock
                </th>
                <th className="text-right font-medium text-muted-foreground px-3 py-3">
                  GST
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {p.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {p.hsnCode || "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCurrency(p.sellingPrice)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {p.type === "STOCK" ? p.currentStock : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">{p.igstRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
