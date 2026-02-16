import { Link } from "react-router-dom";
import { FileText, IndianRupee, Users, Package, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { useDashboard } from "@/hooks/use-business";
import { formatCurrency } from "@/lib/utils";

const COLORS = {
  DRAFT: "#94a3b8",
  FINAL: "#10b981",
  CANCELLED: "#ef4444",
  PAID: "#10b981",
  PARTIAL: "#f59e0b",
  UNPAID: "#ef4444",
};

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          {dashboard?.business.name
            ? `Welcome back, ${dashboard.business.name}`
            : "Business overview"}
        </p>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />

      {!dashboard ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No data yet"
          description="Dashboard data will appear once you start creating invoices."
        />
      ) : (
        <>
          {/* Key Metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total Invoices"
              value={String(dashboard.metrics.totalInvoices)}
              icon={<FileText className="h-4 w-4" />}
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(dashboard.metrics.totalRevenue)}
              icon={<IndianRupee className="h-4 w-4" />}
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
            />
            <StatCard
              label="Parties"
              value={String(dashboard.metrics.totalParties)}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          {/* Charts Section */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Revenue by Month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.revenueByMonth.length > 0 ? (
                  <ChartContainer
                    config={{
                      revenue: {
                        label: "Revenue",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboard.revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatCurrency(Number(value))}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    No revenue data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Invoice Status</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.invoiceStatusBreakdown.length > 0 ? (
                  <ChartContainer
                    config={{
                      count: {
                        label: "Count",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboard.invoiceStatusBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="status"
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                        />
                        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {dashboard.invoiceStatusBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[entry.status as keyof typeof COLORS] || "#6366f1"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                    No invoice data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Status & Top Products */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Payment Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.paymentStatusBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.paymentStatusBreakdown.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS[item.status as keyof typeof COLORS] || "#6366f1",
                            }}
                          />
                          <span className="text-sm font-medium">{item.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(item.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.count} invoices</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                    No payment data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.topProducts.slice(0, 5).map((product, idx) => (
                      <div key={product.productId} className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {idx + 1}
                            </span>
                            <p className="text-sm font-medium">{product.productName}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Qty: {product.totalQuantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(product.totalRevenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                    No product data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.topCustomers.slice(0, 5).map((customer, idx) => (
                    <div key={customer.partyId} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium">{customer.partyName}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {customer.invoiceCount} invoices
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(customer.totalRevenue)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  No customer data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.recentInvoices.length > 0 ? (
                <div className="data-table-container">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Invoice #
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Party
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Paid
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2">
                            <Link
                              to={`/invoices/${inv.id}`}
                              className="font-medium text-accent hover:underline"
                            >
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{inv.partyName}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {new Date(inv.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="px-3 py-2 text-right">{formatCurrency(inv.paidAmount)}</td>
                          <td className="px-4 py-2 text-center">
                            <StatusBadge status={inv.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  No invoices yet
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  const bgColor =
    variant === "success"
      ? "bg-green-500/10 text-green-600"
      : variant === "warning"
        ? "bg-orange-500/10 text-orange-600"
        : "bg-muted text-muted-foreground";

  return (
    <div className="stat-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
}
