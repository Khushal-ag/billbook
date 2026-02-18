import { FileText } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import EmptyState from "@/components/EmptyState";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import {
  DashboardHeroSection,
  DashboardQuickStatsSection,
  DashboardInsightsSection,
  DashboardHighlightsSection,
  DashboardRecentInvoicesSection,
} from "@/components/dashboard/DashboardSections";
import { buildPaymentStatusData } from "@/lib/dashboard";
import { useDashboard } from "@/hooks/use-business";

export default function Dashboard() {
  const { data: dashboard, isPending, error } = useDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  const greeting = dashboard?.business.name
    ? `Welcome back, ${dashboard.business.name}`
    : "Business overview";

  const { data: paymentStatusData, total: totalPaymentAmount } = buildPaymentStatusData(
    dashboard?.paymentStatusBreakdown,
  );

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
          <DashboardHeroSection greeting={greeting} totalPaid={totalPaid} dashboard={dashboard} />
          <DashboardQuickStatsSection dashboard={dashboard} />
          <DashboardInsightsSection
            revenueByMonth={dashboard.revenueByMonth}
            paymentStatusData={paymentStatusData}
            totalPaymentAmount={totalPaymentAmount}
          />
          <DashboardHighlightsSection
            topProducts={dashboard.topProducts}
            topCustomers={dashboard.topCustomers}
          />
          <DashboardRecentInvoicesSection recentInvoices={dashboard.recentInvoices} />
        </div>
      )}
    </div>
  );
}
