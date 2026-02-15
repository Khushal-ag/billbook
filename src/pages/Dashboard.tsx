import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileText, IndianRupee, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBanner from "@/components/ErrorBanner";
import { useDashboard } from "@/hooks/use-business";

// Demo fallback data (used until API is connected)
const DEMO = {
  totalSalesCurrentMonth: "4,85,200.00",
  outstandingAmount: "1,22,350.00",
  invoiceCountDraft: 8,
  invoiceCountFinal: 34,
  lowStockProducts: [
    { id: 1, name: "A4 Paper Ream", currentStock: "5" },
    { id: 2, name: "Ink Cartridge Black", currentStock: "2" },
    { id: 3, name: "USB-C Cable", currentStock: "8" },
  ],
  recentInvoices: [
    {
      id: 1,
      invoiceNumber: "INV-2025-041",
      partyName: "Sharma Traders",
      totalAmount: "12,500.00",
      status: "FINAL" as const,
      invoiceDate: "2025-02-14",
      partyId: 1,
      dueDate: "2025-03-14",
      subTotal: "0",
      discountAmount: "0",
      discountPercent: "0",
      taxAmount: "0",
      paidAmount: "0",
      balanceDue: "0",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 2,
      invoiceNumber: "INV-2025-040",
      partyName: "Patel Electronics",
      totalAmount: "8,200.00",
      status: "DRAFT" as const,
      invoiceDate: "2025-02-13",
      partyId: 2,
      dueDate: "2025-03-13",
      subTotal: "0",
      discountAmount: "0",
      discountPercent: "0",
      taxAmount: "0",
      paidAmount: "0",
      balanceDue: "0",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 3,
      invoiceNumber: "INV-2025-039",
      partyName: "Kumar Supplies",
      totalAmount: "45,000.00",
      status: "FINAL" as const,
      invoiceDate: "2025-02-12",
      partyId: 3,
      dueDate: "2025-03-12",
      subTotal: "0",
      discountAmount: "0",
      discountPercent: "0",
      taxAmount: "0",
      paidAmount: "0",
      balanceDue: "0",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: 4,
      invoiceNumber: "INV-2025-038",
      partyName: "Gupta & Sons",
      totalAmount: "3,750.00",
      status: "CANCELLED" as const,
      invoiceDate: "2025-02-11",
      partyId: 4,
      dueDate: "2025-03-11",
      subTotal: "0",
      discountAmount: "0",
      discountPercent: "0",
      taxAmount: "0",
      paidAmount: "0",
      balanceDue: "0",
      createdAt: "",
      updatedAt: "",
    },
  ],
  monthlySalesTrend: [
    { month: "Sep", amount: "320000" },
    { month: "Oct", amount: "410000" },
    { month: "Nov", amount: "375000" },
    { month: "Dec", amount: "520000" },
    { month: "Jan", amount: "445000" },
    { month: "Feb", amount: "485200" },
  ],
  invoiceStatusBreakdown: [
    { status: "FINAL", count: 34 },
    { status: "DRAFT", count: 8 },
    { status: "CANCELLED", count: 3 },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  FINAL: "hsl(217, 91%, 55%)",
  DRAFT: "hsl(220, 10%, 54%)",
  CANCELLED: "hsl(0, 0%, 55%)",
};

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const stats = dashboard || DEMO;

  const chartData = useMemo(
    () =>
      stats.monthlySalesTrend.map((m) => ({
        month: m.month,
        amount: parseFloat(m.amount.replace(/,/g, "")),
      })),
    [stats.monthlySalesTrend],
  );

  const pieData = useMemo(
    () =>
      stats.invoiceStatusBreakdown.map((s) => ({
        name: s.status,
        value: s.count,
        color: STATUS_COLORS[s.status] || "hsl(220, 10%, 54%)",
      })),
    [stats.invoiceStatusBreakdown],
  );

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Business overview for this month</p>
      </div>

      <ErrorBanner
        error={error}
        fallbackMessage="Failed to load dashboard data. Showing demo data."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Sales (This Month)"
          value={`₹${stats.totalSalesCurrentMonth}`}
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <StatCard
          label="Outstanding Amount"
          value={`₹${stats.outstandingAmount}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Final Invoices"
          value={stats.invoiceCountFinal.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Draft Invoices"
          value={stats.invoiceCountDraft.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(220, 13%, 89%)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(220, 10%, 46%)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(220, 10%, 46%)"
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString("en-IN")}`,
                    "Sales",
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(220,13%,89%)",
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(217, 91%, 55%)"
                  fill="hsl(217, 91%, 55%)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {pieData.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left font-medium px-6 py-2.5">Invoice</th>
                  <th className="text-left font-medium px-3 py-2.5">Party</th>
                  <th className="text-right font-medium px-3 py-2.5">Amount</th>
                  <th className="text-center font-medium px-3 py-2.5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {inv.partyName}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      ₹{inv.totalAmount}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-pending" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No low stock alerts
              </p>
            ) : (
              stats.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm">{p.name}</span>
                  <span className="text-sm font-semibold text-status-overdue">
                    {p.currentStock} left
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
}
