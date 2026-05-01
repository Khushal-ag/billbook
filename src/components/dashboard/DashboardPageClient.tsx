"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ErrorBanner from "@/components/ErrorBanner";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { EMPTY_DASHBOARD } from "@/lib/business/dashboard";
import { useDashboard } from "@/hooks/use-business";
import { useCanCreateInvoice } from "@/hooks/use-can-create-invoice";
import { DashboardHomeHeader } from "@/components/dashboard/home/DashboardHomeHeader";
import { DashboardHomeKpis } from "@/components/dashboard/home/DashboardHomeKpis";
import { DashboardHomeReceivablesPayables } from "@/components/dashboard/home/DashboardHomeReceivablesPayables";
import { DashboardHomeStockPulse } from "@/components/dashboard/home/DashboardHomeStockPulse";
import { DashboardHomeLedgerTable } from "@/components/dashboard/home/DashboardHomeLedgerTable";

const DashboardHomeSalesPurchaseChart = dynamic(
  () =>
    import("@/components/dashboard/home/DashboardHomeSalesPurchaseChart").then((m) => ({
      default: m.DashboardHomeSalesPurchaseChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(320px,55vw)] min-h-[240px] animate-pulse rounded-2xl border border-border/80 bg-muted/40"
        aria-busy="true"
        aria-label="Loading chart"
      />
    ),
  },
);

type DashboardFilter = "monthly" | "overall";

export default function DashboardPageClient() {
  const [filter, setFilter] = useState<DashboardFilter>("monthly");
  const { data: dashboard, isPending, error } = useDashboard(filter);
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

  return (
    <div className="page-container animate-fade-in">
      <ErrorBanner error={error} fallbackMessage="Failed to load dashboard data." />

      <div className="space-y-8 sm:space-y-10">
        <DashboardHomeHeader
          dashboard={data}
          greeting={greeting}
          canCreateInvoice={canCreateInvoice}
        />
        <DashboardHomeKpis dashboard={data} filter={filter} onFilterChange={setFilter} />
        <DashboardHomeSalesPurchaseChart dashboard={data} />
        <DashboardHomeReceivablesPayables dashboard={data} />
        <DashboardHomeStockPulse dashboard={data} />
        <DashboardHomeLedgerTable dashboard={data} />
      </div>
    </div>
  );
}
