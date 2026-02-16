import { FileText, IndianRupee, Users, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import { useDashboard } from "@/hooks/use-business";

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Invoices"
            value={String(dashboard.metrics.totalInvoices)}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            label="Total Amount"
            value={`₹${dashboard.metrics.totalAmount.toLocaleString("en-IN")}`}
            icon={<IndianRupee className="h-4 w-4" />}
          />
          <StatCard
            label="Total Products"
            value={String(dashboard.metrics.totalProducts)}
            icon={<Package className="h-4 w-4" />}
          />
          <StatCard
            label="Total Parties"
            value={String(dashboard.metrics.totalParties)}
            icon={<Users className="h-4 w-4" />}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
}
