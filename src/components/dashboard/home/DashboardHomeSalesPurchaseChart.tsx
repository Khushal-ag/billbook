import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { cn, formatCurrency } from "@/lib/core/utils";
import type { DashboardData } from "@/types/dashboard";
import { buildSalesPurchaseChartData } from "@/lib/business/dashboard-home";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

interface DashboardHomeSalesPurchaseChartProps {
  dashboard: DashboardData;
}

const PLACEHOLDER = [{ month: "—", sales: 0, purchase: 0 }];

type ChartRow = { month: string; sales: number; purchase: number };

function SalesPurchaseTooltip({
  active,
  payload,
  label,
  showPurchaseSeries,
  purchaseEstimated,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  label?: string | number;
  showPurchaseSeries: boolean;
  purchaseEstimated: boolean;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.payload;
  const row = raw && typeof raw === "object" ? (raw as ChartRow) : undefined;
  if (!row || row.month === "—") return null;

  const sales = Number(row.sales) || 0;
  const purchase = Number(row.purchase) || 0;
  const monthLabel = typeof label === "string" && label.trim() ? label : row.month;
  const net = sales - purchase;

  return (
    <div
      className={cn(
        "min-w-[200px] rounded-lg border border-border/60 bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-xl",
        "duration-150 animate-in fade-in-0 zoom-in-95",
      )}
    >
      <p className="border-b border-border/50 pb-2 font-semibold text-foreground">{monthLabel}</p>
      <dl className="mt-2 space-y-2">
        <div className="flex items-center justify-between gap-6">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: "hsl(var(--chart-1))" }}
              aria-hidden
            />
            Sales
          </dt>
          <dd className="font-semibold tabular-nums text-foreground">{formatCurrency(sales)}</dd>
        </div>
        {showPurchaseSeries ? (
          <div className="flex items-center justify-between gap-6">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: "hsl(var(--chart-3))" }}
                aria-hidden
              />
              Purchase
            </dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatCurrency(purchase)}
            </dd>
          </div>
        ) : purchaseEstimated ? (
          <p className="text-[11px] leading-snug text-muted-foreground">
            Purchase for this month is not included yet — only sales are shown in the chart.
          </p>
        ) : null}
        {showPurchaseSeries ? (
          <div className="flex items-center justify-between gap-6 border-t border-border/40 pt-2">
            <dt className="text-muted-foreground">Net (sales − purchase)</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                net >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {formatCurrency(net)}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function DashboardHomeSalesPurchaseChart({
  dashboard,
}: DashboardHomeSalesPurchaseChartProps) {
  const { rows, purchaseIsEstimated } = buildSalesPurchaseChartData(dashboard);
  const data = rows.length > 0 ? rows : PLACEHOLDER;
  const maxPurchase = data.reduce((m, r) => Math.max(m, r.purchase), 0);
  const showPurchaseSeries = maxPurchase > 0;

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Sales vs purchase</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {showPurchaseSeries
              ? "Grouped bars per month — easy to compare sales and purchases side by side."
              : "Sales by month. Purchase bars appear when purchase totals exist for each month."}
          </p>
          {purchaseIsEstimated && rows.length > 0 ? (
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-500/90">
              Purchase totals per month are not shown yet — only sales appear for now.
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={{
            sales: { label: "Sales", color: "hsl(var(--chart-1))" },
            purchase: { label: "Purchase", color: "hsl(var(--chart-3))" },
          }}
          className={cn(
            "h-[min(320px,55vw)] min-h-[260px] w-full",
            "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent",
          )}
        >
          <BarChart
            data={data}
            margin={{ top: 16, right: 8, left: 4, bottom: 8 }}
            barCategoryGap="18%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
            <XAxis
              type="category"
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              width={52}
              domain={[0, "auto"]}
            />
            <ChartTooltip
              cursor={false}
              allowEscapeViewBox={{ x: true, y: true }}
              content={(props) => (
                <SalesPurchaseTooltip
                  {...props}
                  showPurchaseSeries={showPurchaseSeries}
                  purchaseEstimated={purchaseIsEstimated}
                />
              )}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar
              dataKey="sales"
              name="Sales"
              fill="hsl(var(--chart-1))"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            />
            {showPurchaseSeries ? (
              <Bar
                dataKey="purchase"
                name="Purchase"
                fill="hsl(var(--chart-3))"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
              />
            ) : null}
          </BarChart>
        </ChartContainer>
        {rows.length === 0 ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            No monthly data yet. Record sales (and purchases) to populate this chart.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
