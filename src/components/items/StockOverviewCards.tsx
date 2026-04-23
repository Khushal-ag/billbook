import { IndianRupee, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatStockQuantity } from "@/lib/core/utils";

interface StockOverviewCardsProps {
  /** Total cost of inventory (summary.stockValue.totalPurchasedValue) */
  totalPurchasedValue: string;
  /** Number of stock items (summary.stockValue.totalItems) */
  totalItems: number;
  /** Sum of balance quantity (summary.stockValue.totalQuantity) */
  totalQuantity: string;
  /** Number of items below min threshold (summary.lowStock.totalItems) */
  lowStockCount: number;
  /** Sum of on-hand qty across items flagged low (summary.lowStock.totalQuantity), not “shortfall”. */
  lowStockQuantity?: string;
  /** Total value at selling price (summary.stockValue.totalAmount) – card 3 */
  totalSellingValue: string;
}

export function StockOverviewCards({
  totalPurchasedValue,
  totalItems,
  totalQuantity,
  lowStockCount,
  lowStockQuantity,
  totalSellingValue,
}: StockOverviewCardsProps) {
  const lowStockUnitsCombined =
    lowStockQuantity != null && lowStockQuantity.trim() !== ""
      ? Number.parseFloat(lowStockQuantity.replace(/,/g, ""))
      : NaN;
  const hasCombinedUnits = Number.isFinite(lowStockUnitsCombined) && lowStockUnitsCombined >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="rounded-2xl border bg-background/70">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total inventory value (cost)
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(totalPurchasedValue)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Total items: {totalItems} · Total quantity: {formatStockQuantity(totalQuantity)}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`rounded-2xl border ${lowStockCount > 0 ? "border-amber-500/50 bg-amber-500/5" : "bg-background/70"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Low stock
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">
                {lowStockCount === 0
                  ? "No items below minimum stock"
                  : lowStockCount === 1
                    ? "Item is at or below its minimum level"
                    : "Items at or below their minimum level"}
              </p>
              {lowStockCount > 0 && hasCombinedUnits && (
                <p className="mt-2 text-xs leading-snug text-muted-foreground">
                  Combined on-hand stock:{" "}
                  <span className="font-medium text-foreground">
                    {formatStockQuantity(lowStockQuantity!)}{" "}
                    {lowStockUnitsCombined === 1 ? "unit" : "units"}
                  </span>{" "}
                  across {lowStockCount === 1 ? "this product" : "these products"}.
                </p>
              )}
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${lowStockCount > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"}`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-background/70">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Value at selling price
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(totalSellingValue)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Potential revenue</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
