import { Link } from "react-router-dom";
import {
  FileText,
  IndianRupee,
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { useDashboard } from "@/hooks/use-business";
import { formatCurrency } from "@/lib/utils";

/** Maps invoice/payment status keys to Tailwind-compatible CSS variable colors */
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "hsl(var(--status-draft))",
  FINAL: "hsl(var(--status-final))",
  CANCELLED: "hsl(var(--status-cancelled))",
  PAID: "hsl(var(--status-paid))",
  PARTIAL: "hsl(var(--status-pending))",
  UNPAID: "hsl(var(--status-overdue))",
};

export default function Dashboard() {
  const { data: dashboard, isPending, error } = useDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  const greeting = dashboard?.business.name
    ? `Welcome back, ${dashboard.business.name}`
    : "Business overview";

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={greeting}
        action={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/invoices">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Invoices
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/invoices?action=new">
                <span className="mr-1">+</span> New Invoice
              </Link>
            </Button>
          </div>
        }
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />

      {!dashboard ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No data yet"
          description="Dashboard data will appear once you start creating invoices."
        />
      ) : (
        <>
          {/* ── Key Metrics ────────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Invoices"
              value={String(dashboard.metrics.totalInvoices)}
              icon={<FileText className="h-4 w-4" />}
              href="/invoices"
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(dashboard.metrics.totalRevenue)}
              icon={<IndianRupee className="h-4 w-4" />}
              href="/reports"
            />
            <StatCard
              label="Total Paid"
              value={formatCurrency(dashboard.metrics.totalPaid)}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="success"
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(dashboard.metrics.totalOutstanding)}
              icon={<AlertCircle className="h-4 w-4" />}
              variant="warning"
            />
            <StatCard
              label="Products"
              value={String(dashboard.metrics.totalProducts)}
              icon={<Package className="h-4 w-4" />}
              href="/products"
            />
            <StatCard
              label="Parties"
              value={String(dashboard.metrics.totalParties)}
              icon={<Users className="h-4 w-4" />}
              href="/parties"
            />
          </div>

          {/* ── Charts ─────────────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
                <ChartLink to="/reports" label="View report" />
              </CardHeader>
              <CardContent>
                {dashboard.revenueByMonth.length > 0 ? (
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[220px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboard.revenueByMonth}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          fill="url(#revGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <EmptyPlaceholder text="No revenue data yet" />
                )}
              </CardContent>
            </Card>

            {/* Invoice Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Invoice Status</CardTitle>
                <ChartLink to="/invoices" label="All invoices" />
              </CardHeader>
              <CardContent>
                {dashboard.invoiceStatusBreakdown.length > 0 ? (
                  <ChartContainer
                    config={{
                      count: {
                        label: "Count",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[220px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboard.invoiceStatusBreakdown} barCategoryGap="25%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="status"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {dashboard.invoiceStatusBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.status] ?? "hsl(var(--chart-4))"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <EmptyPlaceholder text="No invoice data yet" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Payment Status & Top Products ──────────────────── */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Payment Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.paymentStatusBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.paymentStatusBreakdown.map((item) => {
                      const color = STATUS_COLORS[item.status] ?? "hsl(var(--chart-4))";
                      const total = dashboard.paymentStatusBreakdown.reduce(
                        (s, i) => s + i.count,
                        0,
                      );
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item.status} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-medium">{item.status}</span>
                              <span className="text-muted-foreground">({item.count})</span>
                            </div>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPlaceholder text="No payment data yet" />
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium">Top Products</CardTitle>
                <ChartLink to="/products" label="View all" />
              </CardHeader>
              <CardContent>
                {dashboard.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.topProducts.slice(0, 5).map((product, idx) => {
                      const maxRev = dashboard.topProducts[0]?.totalRevenue || 1;
                      const pct = Math.round((product.totalRevenue / maxRev) * 100);
                      return (
                        <div key={product.productId} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-xs font-medium text-secondary-foreground">
                                {idx + 1}
                              </span>
                              <span className="font-medium">{product.productName}</span>
                              <span className="text-xs text-muted-foreground">
                                Qty {product.totalQuantity}
                              </span>
                            </div>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(product.totalRevenue)}
                            </span>
                          </div>
                          <Progress value={pct} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyPlaceholder text="No product data yet" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Top Customers & Recent Invoices ────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Top Customers */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
                <ChartLink to="/parties" label="View all" />
              </CardHeader>
              <CardContent>
                {dashboard.topCustomers.length > 0 ? (
                  <div className="space-y-1">
                    {dashboard.topCustomers.slice(0, 5).map((customer) => (
                      <div
                        key={customer.partyId}
                        className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                          {customer.partyName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{customer.partyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.invoiceCount} invoice
                            {customer.invoiceCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(customer.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPlaceholder text="No customer data yet" />
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
                <ChartLink to="/invoices" label="View all" />
              </CardHeader>
              <CardContent className="p-0">
                {dashboard.recentInvoices.length > 0 ? (
                  <div className="data-table-container">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th
                            scope="col"
                            className="px-4 py-2 text-left font-medium text-muted-foreground"
                          >
                            Invoice #
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-left font-medium text-muted-foreground"
                          >
                            Party
                          </th>
                          <th
                            scope="col"
                            className="hidden px-4 py-2 text-left font-medium text-muted-foreground sm:table-cell"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-right font-medium text-muted-foreground"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-2 text-center font-medium text-muted-foreground"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentInvoices.slice(0, 6).map((inv) => (
                          <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2.5">
                              <Link
                                to={`/invoices/${inv.id}`}
                                className="font-medium text-accent hover:underline"
                              >
                                {inv.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">{inv.partyName}</td>
                            <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                              {new Date(inv.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                              {formatCurrency(inv.totalAmount)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <StatusBadge status={inv.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyPlaceholder text="No invoices yet" />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Shared sub-components ──────────────────────────────────── */

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function ChartLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {label} <ArrowRight className="ml-1 h-3 w-3" />
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
  href?: string;
}) {
  const iconBg =
    variant === "success"
      ? "bg-status-paid-bg text-status-paid"
      : variant === "warning"
        ? "bg-status-pending-bg text-status-pending"
        : "bg-accent/10 text-accent";

  const card = (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${iconBg}`}>
            {icon}
          </div>
        </div>
        <p className="text-xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link to={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
