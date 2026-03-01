import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { StockListItem } from "@/types/item";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface StockReportTableProps {
  rows: StockListItem[];
  onAdjust?: (itemId: number, itemName: string) => void;
}

export function StockReportTable({ rows, onAdjust }: StockReportTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-16">
        <p className="text-sm font-medium text-foreground">No stock data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add stock entries in the Add Stock tab to see the report here.
        </p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="w-full text-sm" role="table" aria-label="Stock report">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="min-w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Item
            </th>
            <th className="min-w-[56px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unit
            </th>
            <th className="min-w-[80px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Purchased
            </th>
            <th className="min-w-[80px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Adjusted
            </th>
            <th className="min-w-[80px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sold
            </th>
            <th className="min-w-[88px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current
            </th>
            <th className="min-w-[90px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Value
            </th>
            <th className="min-w-[80px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            {onAdjust && (
              <th className="w-20 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.itemId} className="transition-colors hover:bg-muted/30">
              <td className="px-4 py-3.5">
                <Link
                  to={`/items/${row.itemId}`}
                  className="font-medium text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.itemName}
                </Link>
              </td>
              <td className="px-3 py-3.5 align-middle text-muted-foreground">{row.unit || "—"}</td>
              <td className="px-3 py-3.5 text-right align-middle tabular-nums text-muted-foreground">
                {formatNumber(row.quantityPurchased)}
              </td>
              <td className="px-3 py-3.5 text-right align-middle tabular-nums text-muted-foreground">
                {formatNumber(row.quantityAdjusted)}
              </td>
              <td className="px-3 py-3.5 text-right align-middle tabular-nums text-muted-foreground">
                {formatNumber(row.quantitySold)}
              </td>
              <td className="px-4 py-3.5 text-right align-middle font-semibold tabular-nums">
                {formatNumber(row.actualQuantity)}
              </td>
              <td className="px-3 py-3.5 text-right align-middle tabular-nums text-muted-foreground">
                {row.stockValue != null ? formatCurrency(row.stockValue) : "—"}
              </td>
              <td className="px-3 py-3.5 text-center">
                {row.isLowStock ? (
                  <Badge variant="destructive" className="text-xs">
                    Low stock
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">OK</span>
                )}
              </td>
              {onAdjust && (
                <td className="px-3 py-3.5 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjust(row.itemId, row.itemName);
                    }}
                    title="Adjust stock"
                    aria-label={`Adjust stock for ${row.itemName}`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
