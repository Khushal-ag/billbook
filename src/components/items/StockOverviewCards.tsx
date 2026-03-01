import { Package, IndianRupee, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StockOverviewCardsProps {
  totalStockValue: string;
  lowStockCount: number;
  totalItems: number;
}

export function StockOverviewCards({
  totalStockValue,
  lowStockCount,
  totalItems,
}: StockOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="rounded-2xl border bg-background/70">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total stock value
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(totalStockValue)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Low stock items
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{lowStockCount}</p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${lowStockCount > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"}`}
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
                Stock items
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{totalItems}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
