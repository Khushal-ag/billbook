"use client";

import dynamic from "next/dynamic";
import ErrorBanner from "@/components/ErrorBanner";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import {
  DashboardHeroSection,
  DashboardQuickStatsSection,
  DashboardHighlightsSection,
  DashboardRecentInvoicesSection,
} from "@/components/dashboard/DashboardSections";

const DashboardInsightsSection = dynamic(
  () =>
    import("@/components/dashboard/DashboardInsightsSection").then((m) => ({
      default: m.DashboardInsightsSection,
    })),
  {
    ssr: false,
    loading: () => (
      <section className="space-y-5" aria-busy="true" aria-label="Loading charts">
        <div className="h-10 max-w-sm animate-pulse rounded-lg bg-muted/60" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-[min(320px,55vw)] min-h-[220px] animate-pulse rounded-2xl bg-muted/40 lg:col-span-2" />
          <div className="h-[min(320px,55vw)] min-h-[220px] animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </section>
    ),
  },
);
import { buildPaymentStatusData, buildInvoiceStatusData, EMPTY_DASHBOARD } from "@/lib/dashboard";
import { useDashboard } from "@/hooks/use-business";
import { useCanCreateInvoice } from "@/hooks/use-can-create-invoice";

export default function DashboardPageClient() {
  const { data: dashboard, isPending, error } = useDashboard();
  const { canCreateInvoice } = useCanCreateInvoice();

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
        <DashboardHeroSection
          greeting={greeting}
          dashboard={data}
          canCreateInvoice={canCreateInvoice}
        />
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
        <DashboardRecentInvoicesSection
          recentInvoices={data.recentInvoices ?? []}
          canCreateInvoice={canCreateInvoice}
        />
      </div>
    </div>
  );
}
