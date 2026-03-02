import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CHART_COLORS, type PaymentStatusItem } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";
import type { RevenueByMonth } from "@/types/dashboard";

/** Placeholder so bar chart always shows axes and frame with no data */
const EMPTY_REVENUE_PLACEHOLDER: RevenueByMonth[] = [{ month: "—", revenue: 0, invoiceCount: 0 }];

/** Placeholder so pie chart always shows donut with no data */
const EMPTY_PIE_PLACEHOLDER: PaymentStatusItem[] = [
  { name: "PAID", value: 0, count: 0, fill: "hsl(var(--muted) / 0.4)" },
];

interface DashboardInsightsSectionProps {
  revenueByMonth: RevenueByMonth[];
  paymentStatusData: PaymentStatusItem[];
  totalPaymentAmount: number;
}

const CustomPaymentTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PaymentStatusItem; value: number }>;
}) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const isPlaceholder = data.value === 0 && data.count === 0;

  if (isPlaceholder) {
    return (
      <div className="rounded-xl border border-border/50 bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-sm">
        No payment data yet
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 shadow-lg backdrop-blur-sm">
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: data.fill }} />
          <span className="font-semibold text-foreground">{data.name}</span>
        </div>
        <div className="space-y-1 border-t border-border/30 pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Amount:</span>
            <span className="font-semibold text-foreground">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Count:</span>
            <span className="font-semibold text-foreground">{data.count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function DashboardInsightsSection({
  revenueByMonth,
  paymentStatusData,
  totalPaymentAmount,
}: DashboardInsightsSectionProps) {
  const isSimpleMode = useIsSimpleMode();

  // In simple mode, only show the essential payment status chart
  if (isSimpleMode) {
    return (
      <section className="space-y-4">
        <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col items-center gap-6">
              <ChartContainer config={{}} className="h-[220px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        paymentStatusData.length > 0
                          ? paymentStatusData
                          : [{ ...EMPTY_PIE_PLACEHOLDER[0], value: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(paymentStatusData.length > 0
                        ? paymentStatusData
                        : [{ ...EMPTY_PIE_PLACEHOLDER[0], value: 1 }]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<CustomPaymentTooltip />} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              {paymentStatusData.length > 0 ? (
                <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  {paymentStatusData.map((item) => {
                    const share = totalPaymentAmount
                      ? Math.round((item.value / totalPaymentAmount) * 100)
                      : 0;
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.name} ({item.count})
                        </span>
                        <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                        <span className="text-xs text-muted-foreground">· {share}%</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground">No payment data yet</p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Payment breakdown will appear once you have invoices.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Advanced mode shows full dashboard
  return (
    <section className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
              <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground">
                View reports →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              config={{ revenue: { label: "Revenue", color: CHART_COLORS.primary } }}
              className="h-[260px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByMonth.length > 0 ? revenueByMonth : EMPTY_REVENUE_PLACEHOLDER}
                  maxBarSize={60}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    width={50}
                    domain={[0, "auto"]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                    }
                    cursor={false}
                  />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            {revenueByMonth.length === 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                No revenue data this period. Create invoices to see trends here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col items-center gap-4">
              <ChartContainer config={{}} className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        paymentStatusData.length > 0
                          ? paymentStatusData
                          : [{ ...EMPTY_PIE_PLACEHOLDER[0], value: 1 }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(paymentStatusData.length > 0
                        ? paymentStatusData
                        : [{ ...EMPTY_PIE_PLACEHOLDER[0], value: 1 }]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<CustomPaymentTooltip />} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              {paymentStatusData.length > 0 ? (
                <div className="w-full space-y-2">
                  {paymentStatusData.map((item) => {
                    const share = totalPaymentAmount
                      ? Math.round((item.value / totalPaymentAmount) * 100)
                      : 0;
                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-xl border border-muted/50 bg-background/70 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">({item.count})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{share}%</span>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full space-y-1 text-center">
                  <p className="text-xs font-medium text-muted-foreground">No payment data yet</p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Payment breakdown will appear once you have invoices.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
