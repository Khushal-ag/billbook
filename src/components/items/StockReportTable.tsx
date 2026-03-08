import Link from "next/link";
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

function qtyDisplay(value: string | null): string {
  return value != null && value !== "" ? formatQuantity(value) : "—";
}

export function StockReportTable({ rows, items, onAdjust }: StockReportTableProps) {
  const isService = (row: StockListItem) =>
    row.itemType === "SERVICE" || items?.find((i) => i.id === row.itemId)?.type === "SERVICE";
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
      <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[320px] text-sm" role="table" aria-label="Stock by item">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={cn(thClass, "pl-3 text-left sm:pl-4")}>Item</th>
              <th className={cn(thClass, "hidden text-left sm:table-cell")}>Unit</th>
              <th className={cn(thRight, "hidden md:table-cell")}>Purchased</th>
              <th className={cn(thRight, "hidden md:table-cell")}>Adjusted</th>
              <th className={cn(thRight, "hidden md:table-cell")}>Sold</th>
              <th className={cn(thRight, "min-w-[72px]")}>Current</th>
              <th className={cn(thRight, "hidden sm:table-cell")}>Value (sell)</th>
              <th className={cn(thRight, "hidden lg:table-cell")}>Value (cost)</th>
              <th className={cn(thClass, "hidden text-center md:table-cell")}>Status</th>
              {onAdjust && (
                <th className={cn(thClass, "min-w-[92px] px-2 text-left sm:px-4")}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const service = isService(row);
              return (
                <tr
                  key={row.itemId}
                  className={cn(
                    "border-b border-border/80 transition-colors hover:bg-muted/30",
                    i % 2 === 1 && "bg-muted/10",
                  )}
                >
                  <td className={cn(tdClass, "pl-3 text-left sm:pl-4")}>
                    <Link
                      href={`/items/${row.itemId}`}
                      className="font-medium text-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.itemName}
                    </Link>
                  </td>
                  <td
                    className={cn(tdClass, "hidden text-left text-muted-foreground sm:table-cell")}
                  >
                    {row.unit || "—"}
                  </td>
                  <td className={cn(tdRight, "hidden text-muted-foreground md:table-cell")}>
                    {service ? "—" : qtyDisplay(row.quantityPurchased)}
                  </td>
                  <td className={cn(tdRight, "hidden text-muted-foreground md:table-cell")}>
                    {service ? "—" : qtyDisplay(row.quantityAdjusted)}
                  </td>
                  <td className={cn(tdRight, "hidden text-muted-foreground md:table-cell")}>
                    {service ? "—" : qtyDisplay(row.quantitySold)}
                  </td>
                  <td className={cn(tdRight, "font-semibold")}>
                    {service ? "—" : qtyDisplay(row.actualQuantity)}
                  </td>
                  <td className={cn(tdRight, "hidden text-muted-foreground sm:table-cell")}>
                    {service && row.defaultRate != null
                      ? formatCurrency(row.defaultRate)
                      : row.stockValue != null
                        ? formatCurrency(row.stockValue)
                        : "—"}
                  </td>
                  <td className={cn(tdRight, "hidden text-muted-foreground lg:table-cell")}>
                    {service
                      ? "—"
                      : row.purchasedValue != null
                        ? formatCurrency(row.purchasedValue)
                        : "—"}
                  </td>
                  <td className={cn(tdClass, "hidden text-center md:table-cell")}>
                    {service ? (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    ) : row.isLowStock === true ? (
                      <Badge variant="destructive" className="text-xs font-medium">
                        Low stock
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">OK</span>
                    )}
                  </td>
                  {onAdjust && (
                    <td className={cn(tdClass, "w-[92px] px-2 text-left sm:px-4")}>
                      <div className="flex min-h-8 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={service}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (service) return;
                            onAdjust(row.itemId, row.itemName);
                          }}
                          title={service ? "Not available for service items" : "Adjust stock"}
                          aria-label={`Adjust stock for ${row.itemName}`}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
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
