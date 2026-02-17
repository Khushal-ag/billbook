import { Link } from "react-router-dom";
import {
  FileText,
  IndianRupee,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { useDashboard } from "@/hooks/use-business";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "hsl(142 76% 36%)",
  PARTIAL: "hsl(38 92% 50%)",
  UNPAID: "hsl(0 84% 60%)",
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  PAID: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  PARTIAL: <Clock className="h-4 w-4 text-amber-500" />,
  UNPAID: <AlertTriangle className="h-4 w-4 text-rose-500" />,
};

export default function Dashboard() {
  const { data: dashboard, isPending, error } = useDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  const greeting = dashboard?.business.name
    ? `Welcome back, ${dashboard.business.name}`
    : "Business overview";

  const paymentStatusData =
    dashboard?.paymentStatusBreakdown.map((item) => ({
      name: item.status,
      value: item.totalAmount,
      count: item.count,
      fill: PAYMENT_COLORS[item.status] ?? CHART_COLORS.quaternary,
    })) ?? [];
  const totalPaymentAmount = paymentStatusData.reduce((sum, item) => sum + item.value, 0);

  const totalPaid = dashboard?.totalPaidFromInvoiceField ?? dashboard?.totalPaid ?? 0;

  return (
    <div className="page-container animate-fade-in">
      <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />

      {!dashboard ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No data yet"
          description="Dashboard data will appear once you start creating invoices."
        />
      ) : (
        <div className="space-y-10">
          {/* ── Hero Section ─────────────────────────────────────── */}
          <section className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Dashboard
                </p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Business overview
                </h1>
                <p className="text-sm text-muted-foreground">{greeting}</p>
              </div>
              <Button asChild size="lg" className="h-11 rounded-full px-6">
                <Link to="/invoices?action=new">
                  <span className="mr-1">+</span> New Invoice
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <HeroCard
                title="Gross Invoiced"
                value={formatCurrency(dashboard.totalInvoicedGross ?? dashboard.totalRevenue)}
                subtitle={`Net: ${formatCurrency(dashboard.totalRevenueNet ?? dashboard.totalRevenue)}`}
                icon={<IndianRupee className="h-5 w-5" />}
                trend={dashboard.revenueByMonth.length > 1 ? "up" : undefined}
                href="/reports"
              />
              <HeroCard
                title="Total Paid"
                value={formatCurrency(totalPaid)}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="success"
              />
              <HeroCard
                title="Outstanding"
                value={formatCurrency(
                  dashboard.netOutstanding ?? String(dashboard.totalOutstanding),
                )}
                icon={<TrendingDown className="h-5 w-5" />}
                variant={
                  Number(dashboard.netOutstanding ?? dashboard.totalOutstanding) > 0
                    ? "warning"
                    : "default"
                }
              />
              <HeroCard
                title="Invoices"
                value={String(dashboard.totalInvoices)}
                subtitle={`${dashboard.totalProducts} products · ${dashboard.totalParties} parties`}
                icon={<FileText className="h-5 w-5" />}
                href="/invoices"
              />
            </div>
          </section>

          {/* ── Quick Stats Row ──────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Business snapshot</h2>
              <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground">
                View analytics →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <QuickStat label="Products" value={dashboard.totalProducts} href="/products">
                <Package className="h-4 w-4 text-muted-foreground" />
              </QuickStat>
              <QuickStat label="Parties" value={dashboard.totalParties} href="/parties">
                <Users className="h-4 w-4 text-muted-foreground" />
              </QuickStat>
              {dashboard.totalReceivables != null && (
                <QuickStat
                  label="Receivables"
                  value={formatCurrency(dashboard.totalReceivables)}
                  variant="warning"
                >
                  <TrendingDown className="h-4 w-4" />
                </QuickStat>
              )}
              {dashboard.totalAdvanceBalance != null && (
                <QuickStat
                  label="Advance"
                  value={formatCurrency(dashboard.totalAdvanceBalance)}
                  variant="success"
                >
                  <TrendingUp className="h-4 w-4" />
                </QuickStat>
              )}
            </div>
          </section>

          {/* ── Revenue Trend + Payment Status ───────────────────── */}
          <section className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Revenue Trend */}
              <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50 lg:col-span-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                    <Link
                      to="/reports"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      View reports →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {dashboard.revenueByMonth.length > 0 ? (
                    <ChartContainer
                      config={{ revenue: { label: "Revenue", color: CHART_COLORS.primary } }}
                      className="h-[260px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboard.revenueByMonth}>
                          <defs>
                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor={CHART_COLORS.primary}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor={CHART_COLORS.primary}
                                stopOpacity={0}
                              />
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
                            content={
                              <ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />
                            }
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

              {/* Payment Status */}
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
                              content={<PaymentTooltipContent formatter={formatCurrency} />}
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
                                {PAYMENT_ICONS[item.name]}
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({item.count})
                                </span>
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

          {/* ── Top Products + Top Customers + Recent Invoices ───── */}
          <section className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Products */}
              <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Top Products</CardTitle>
                    <Link
                      to="/products"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      View all →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {dashboard.topProducts.length > 0 ? (
                    <div className="divide-y divide-border/60">
                      {dashboard.topProducts.slice(0, 5).map((product, idx) => (
                        <div
                          key={product.productId}
                          className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-background/70"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.totalQuantity} sold
                            </p>
                          </div>
                          <p className="text-sm font-medium tabular-nums">
                            {formatCurrency(product.totalRevenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyChart text="No product data yet" height={150} />
                  )}
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
                    <Link
                      to="/parties"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      View all →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {dashboard.topCustomers.length > 0 ? (
                    <div className="divide-y divide-border/60">
                      {dashboard.topCustomers.slice(0, 5).map((customer) => (
                        <div
                          key={customer.partyId}
                          className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-background/70"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-sm font-semibold text-accent">
                            {customer.partyName.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{customer.partyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.invoiceCount} invoice
                              {customer.invoiceCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <p className="text-sm font-medium tabular-nums">
                            {formatCurrency(customer.totalRevenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyChart text="No customer data yet" height={150} />
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            {/* Recent Invoices */}
            <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {dashboard.recentInvoices.length} invoice
                      {dashboard.recentInvoices.length === 1 ? "" : "s"}
                    </span>
                    <Link to="/invoices" className="hover:text-foreground">
                      View all →
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {dashboard.recentInvoices.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-muted/50 bg-background/70">
                    <table className="w-full text-sm" role="table" aria-label="Recent invoices">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium">Invoice</th>
                          <th className="px-4 py-3 text-left font-medium">Customer</th>
                          <th className="px-4 py-3 text-left font-medium">Date</th>
                          <th className="px-4 py-3 text-right font-medium">Amount</th>
                          <th className="px-4 py-3 text-right font-medium">Paid</th>
                          <th className="px-4 py-3 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentInvoices.slice(0, 5).map((inv) => (
                          <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <Link
                                to={`/invoices/${inv.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {inv.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {inv.partyName.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate font-medium">{inv.partyName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {formatDate(inv.invoiceDate)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums">
                              {formatCurrency(inv.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                              {formatCurrency(inv.paidAmount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <StatusBadge status={inv.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyChart text="No invoices yet" height={150} />
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function EmptyChart({ text, height = 180 }: { text: string; height?: number }) {
  return (
    <div
      className={cn("flex items-center justify-center text-sm text-muted-foreground")}
      style={{ height }}
    >
      {text}
    </div>
  );
}

function HeroCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  trend,
  href,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
  trend?: "up" | "down";
  href?: string;
}) {
  const variantStyles = {
    default: "bg-card",
    success:
      "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30",
    warning: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
  };

  const iconStyles = {
    default: "text-accent",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  const content = (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${variantStyles[variant]}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`rounded-xl bg-background/80 p-2.5 ${iconStyles[variant]}`}>{icon}</div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            <span>Trending</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link to={href} className="group block">
      {content}
    </Link>
  ) : (
    content
  );
}

function QuickStat({
  label,
  value,
  href,
  variant = "default",
  children,
}: {
  label: string;
  value: string | number;
  href?: string;
  variant?: "default" | "success" | "warning";
  children?: React.ReactNode;
}) {
  const variantStyles = {
    default: "",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  const content = (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50">
      {children}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`truncate text-sm font-semibold tabular-nums ${variantStyles[variant]}`}>
          {value}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link to={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

/* ─── Custom Tooltip Components ──────────────────────────────── */

interface TooltipPayload {
  name?: string;
  value?: number;
  payload?: Record<string, unknown>;
}

function PaymentTooltipContent({
  active,
  payload,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  formatter: (v: number | string) => string;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const count = (data.payload as Record<string, unknown>)?.count as number;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-medium">{data.name}</p>
      <p className="text-muted-foreground">{count} invoices</p>
      <p className="font-semibold">{formatter(data.value ?? 0)}</p>
    </div>
  );
}
