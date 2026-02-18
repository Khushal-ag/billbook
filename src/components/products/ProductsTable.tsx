import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductsTableProps {
  products: Product[];
  isOwner: boolean;
  deletePending: boolean;
  onEdit: (product: Product) => void;
  onStockAdjust: (product: Product) => void;
  onDelete: (product: Product) => void;
  onSelectDetail: (id: number) => void;
}

export function ProductsTable({
  products,
  isOwner,
  deletePending,
  onEdit,
  onStockAdjust,
  onDelete,
  onSelectDetail,
}: ProductsTableProps) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm" role="table" aria-label="Products and services list">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Name
            </th>
            <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
              Type
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              HSN/SAC
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Selling Price
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell"
            >
              Stock
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell"
            >
              GST
            </th>
            <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20"
              onClick={() => onSelectDetail(p.id)}
            >
              <td className="max-w-[200px] truncate px-4 py-3 font-medium sm:max-w-none sm:px-6">
                {p.name}
              </td>
              <td className="px-3 py-3">
                <Badge variant="secondary" className="text-xs">
                  {p.type}
                </Badge>
              </td>
              <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                {p.hsnCode || p.sacCode || "—"}
              </td>
              <td className="px-3 py-3 text-right">{formatCurrency(p.sellingPrice ?? "0")}</td>
              <td className="hidden px-3 py-3 text-right lg:table-cell">
                {p.type === "SERVICE" ? "N/A" : "—"}
              </td>
              <td className="hidden px-3 py-3 text-right md:table-cell">{p.igstRate ?? "0"}%</td>
              <td className="px-3 py-3 text-center">
                <div
                  className="flex items-center justify-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(p)}
                    title="Edit"
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {p.type === "STOCK" && isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStockAdjust(p)}
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
                      onClick={() => onDelete(p)}
                      disabled={deletePending}
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
  );
}
