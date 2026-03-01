import { IndianRupee, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatQuantity } from "@/lib/utils";

interface StockOverviewCardsProps {
  /** Total cost of inventory (summary.stockValue.totalPurchasedValue) */
  totalPurchasedValue: string;
  /** Number of stock items (summary.stockValue.totalItems) */
  totalItems: number;
  /** Sum of balance quantity (summary.stockValue.totalQuantity) */
  totalQuantity: string;
  /** Number of items below min threshold (summary.lowStock.totalItems) */
  lowStockCount: number;
  /** Optional: sum of qty for low-stock items (summary.lowStock.totalQuantity) */
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
                Total items: {totalItems} · Total quantity: {formatQuantity(totalQuantity)}
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
              {lowStockQuantity != null && lowStockCount > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatQuantity(lowStockQuantity)} qty below threshold
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
