import ErrorBanner from "@/components/ErrorBanner";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import {
  DashboardHeroSection,
  DashboardQuickStatsSection,
  DashboardInsightsSection,
  DashboardHighlightsSection,
  DashboardRecentInvoicesSection,
} from "@/components/dashboard/DashboardSections";
import { buildPaymentStatusData, EMPTY_DASHBOARD } from "@/lib/dashboard";
import { useDashboard } from "@/hooks/use-business";

export default function Dashboard() {
  const { data: dashboard, isPending, error } = useDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  // Always show full dashboard layout; use empty data when API returns nothing so charts/cards stay visible.
  const data = dashboard ?? EMPTY_DASHBOARD;
  const greeting = data.business?.name
    ? `Welcome back, ${data.business.name}`
    : "Business overview";

  const { data: paymentStatusData, total: totalPaymentAmount } = buildPaymentStatusData(
    data.paymentStatusBreakdown,
  );

  const totalPaid = data.totalPaidFromInvoiceField ?? data.totalPaid ?? 0;

  return (
    <div className="page-container animate-fade-in">
      <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />

      <div className="space-y-10">
        <DashboardHeroSection greeting={greeting} totalPaid={totalPaid} dashboard={data} />
        <DashboardQuickStatsSection dashboard={data} />
        <DashboardInsightsSection
          revenueByMonth={data.revenueByMonth ?? []}
          paymentStatusData={paymentStatusData}
          totalPaymentAmount={totalPaymentAmount}
        />
        <DashboardHighlightsSection
          topItems={data.topItems ?? []}
          topCustomers={data.topCustomers ?? []}
        />
        <DashboardRecentInvoicesSection recentInvoices={data.recentInvoices ?? []} />
      </div>
    </div>
  );
}
