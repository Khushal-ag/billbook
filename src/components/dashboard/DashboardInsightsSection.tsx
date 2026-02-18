import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { EmptyChart, PaymentTooltipContent } from "./dashboard-utils";
import { CHART_COLORS, type PaymentStatusItem } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";
import type { RevenueByMonth } from "@/types/dashboard";

interface DashboardInsightsSectionProps {
  revenueByMonth: RevenueByMonth[];
  paymentStatusData: PaymentStatusItem[];
  totalPaymentAmount: number;
}

export function DashboardInsightsSection({
  revenueByMonth,
  paymentStatusData,
  totalPaymentAmount,
}: DashboardInsightsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50 lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
              <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground">
                View reports →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueByMonth.length > 0 ? (
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: CHART_COLORS.primary } }}
                className="h-[260px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      fill="url(#revGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <EmptyChart text="No revenue data yet" />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {paymentStatusData.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <ChartContainer config={{}} className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<PaymentTooltipContent valueFormatter={formatCurrency} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
                          {/* Icon would go here */}
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
              </div>
            ) : (
              <EmptyChart text="No payment data yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
