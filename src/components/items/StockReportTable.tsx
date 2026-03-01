import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SlidersHorizontal, Package } from "lucide-react";
import type { StockListItem } from "@/types/item";
import type { Item } from "@/types/item";
import { formatQuantity, formatCurrency, cn } from "@/lib/utils";

interface StockReportTableProps {
  rows: StockListItem[];
  /** Used to detect SERVICE items so cost/stock columns show "—" and adjust is hidden */
  items?: Item[];
  onAdjust?: (itemId: number, itemName: string) => void;
}

const thClass = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const thRight = thClass + " text-right";
const tdClass = "px-4 py-3 align-middle";
const tdRight = tdClass + " text-right tabular-nums";

export function StockReportTable({ rows, items, onAdjust }: StockReportTableProps) {
  const isService = (itemId: number) => items?.find((i) => i.id === itemId)?.type === "SERVICE";
  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No stock data yet</p>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Add stock entries in the Add Stock tab to see items and quantities here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Stock by item">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={cn(thClass, "text-left")}>Item</th>
              <th className={cn(thClass, "text-left")}>Unit</th>
              <th className={cn(thRight)}>Purchased</th>
              <th className={cn(thRight)}>Adjusted</th>
              <th className={cn(thRight)}>Sold</th>
              <th className={cn(thRight)}>Current</th>
              <th className={cn(thRight)}>Value (sell)</th>
              <th className={cn(thRight)}>Value (cost)</th>
              <th className={cn(thClass, "text-center")}>Status</th>
              {onAdjust && (
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const service = isService(row.itemId);
              return (
                <tr
                  key={row.itemId}
                  className={cn(
                    "border-b border-border/80 transition-colors hover:bg-muted/30",
                    i % 2 === 1 && "bg-muted/10",
                  )}
                >
                  <td className={cn(tdClass, "text-left")}>
                    <Link
                      to={`/items/${row.itemId}`}
                      className="font-medium text-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.itemName}
                    </Link>
                  </td>
                  <td className={cn(tdClass, "text-left text-muted-foreground")}>
                    {row.unit || "—"}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {formatQuantity(row.quantityPurchased)}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {formatQuantity(row.quantityAdjusted)}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {formatQuantity(row.quantitySold)}
                  </td>
                  <td className={cn(tdRight, "font-semibold")}>
                    {formatQuantity(row.actualQuantity)}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {/* Value (sell): show when API returns stockValue; for SERVICE, backend should return total at selling rate */}
                    {row.stockValue != null ? formatCurrency(row.stockValue) : "—"}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {service
                      ? "—"
                      : row.purchasedValue != null
                        ? formatCurrency(row.purchasedValue)
                        : "—"}
                  </td>
                  <td className={cn(tdClass, "text-center")}>
                    {service ? (
                      <span className="text-xs text-muted-foreground">Service</span>
                    ) : row.isLowStock ? (
                      <Badge variant="destructive" className="text-xs font-medium">
                        Low stock
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">OK</span>
                    )}
                  </td>
                  {onAdjust && (
                    <td className="px-4 py-3 text-center">
                      {!service && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdjust(row.itemId, row.itemName);
                          }}
                          title="Adjust stock"
                          aria-label={`Adjust stock for ${row.itemName}`}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
