"use client";

import ErrorBanner from "@/components/ErrorBanner";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import {
  DashboardHeroSection,
  DashboardQuickStatsSection,
  DashboardInsightsSection,
  DashboardHighlightsSection,
  DashboardRecentInvoicesSection,
} from "@/components/dashboard/DashboardSections";
import { buildPaymentStatusData, buildInvoiceStatusData, EMPTY_DASHBOARD } from "@/lib/dashboard";
import { useDashboard } from "@/hooks/use-business";

export default function DashboardPageClient() {
  const { data: dashboard, isPending, error } = useDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboard) {
    return (
      <div className="page-container animate-fade-in">
        <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />
      </div>
    );
  }

  const data = dashboard ?? EMPTY_DASHBOARD;
  const greeting = data.business?.name
    ? `Welcome back, ${data.business.name}`
    : "Business overview";

  const { data: paymentStatusData, total: totalPaymentAmount } = buildPaymentStatusData(
    data.paymentStatusBreakdown,
  );
  const { data: invoiceStatusData, total: totalInvoiceStatusAmount } = buildInvoiceStatusData(
    data.invoiceStatusBreakdown,
  );

  return (
    <div className="page-container animate-fade-in">
      <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />

      <div className="space-y-8 sm:space-y-10">
        <DashboardHeroSection greeting={greeting} dashboard={data} />
        <DashboardQuickStatsSection dashboard={data} />
        <DashboardInsightsSection
          revenueByMonth={data.revenueByMonth ?? []}
          paymentStatusData={paymentStatusData}
          totalPaymentAmount={totalPaymentAmount}
          invoiceStatusData={invoiceStatusData}
          totalInvoiceStatusAmount={totalInvoiceStatusAmount}
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
