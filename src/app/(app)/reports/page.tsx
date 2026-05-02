"use client";

import { useMemo, useState } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportsDashboardSection } from "@/components/reports/ReportsDashboardSection";
import { ReportsDashboardSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportsDashboard } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportHub } from "@/lib/reports/report-labels";
import type { ReportsDashboardQuery } from "@/types/report";

type DashboardPeriodTab = "monthly" | "overall" | "custom";

export default function ReportsPage() {
  const [periodTab, setPeriodTab] = useState<DashboardPeriodTab>("monthly");

  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useDateRange({ maxMonths: MAX_REPORT_DATE_RANGE_MONTHS });

  const dashboardQuery: ReportsDashboardQuery = useMemo(() => {
    if (periodTab === "monthly") return { filter: "monthly" };
    if (periodTab === "overall") return { filter: "overall" };
    return { startDate: validStartDate, endDate: validEndDate };
  }, [periodTab, validStartDate, validEndDate]);

  const { data, isPending, error } = useReportsDashboard(dashboardQuery);

  const showCustomHint = periodTab === "custom";

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title={reportHub.title} description={reportHub.description} />

      <ErrorBanner error={error} fallbackMessage="Failed to load reports summary" />

      <div className="mb-5 space-y-4 border-b border-border/50 pb-4 sm:mb-6 sm:pb-4">
        <Tabs
          value={periodTab}
          onValueChange={(v) => setPeriodTab(v as DashboardPeriodTab)}
          className="w-full"
        >
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-3 gap-1 sm:inline-flex sm:w-auto">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">
              This month
            </TabsTrigger>
            <TabsTrigger value="overall" className="text-xs sm:text-sm">
              All time
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs sm:text-sm">
              Custom range
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {showCustomHint ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
            <DateRangePicker
              compact
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              error={dateRangeError}
            />
            <p className="text-pretty text-[11px] leading-relaxed text-muted-foreground sm:min-w-0 sm:max-w-[20rem] sm:flex-1 sm:self-center lg:max-w-md">
              Activity totals use your selected range (max {MAX_REPORT_DATE_RANGE_MONTHS} months).
              Money owed below uses each party’s current balance (always up to date).
            </p>
          </div>
        ) : (
          <p className="max-w-2xl text-pretty text-[11px] leading-relaxed text-muted-foreground">
            {periodTab === "monthly"
              ? "Activity totals are for the current calendar month. Money owed uses each party’s current balance."
              : "Activity totals are all-time. Money owed uses each party’s current balance."}
          </p>
        )}
      </div>

      {isPending ? (
        <ReportsDashboardSkeleton />
      ) : data ? (
        <ReportsDashboardSection data={data} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/10 py-8 text-center text-sm text-muted-foreground">
          {periodTab === "custom"
            ? `Select a valid date range (max ${MAX_REPORT_DATE_RANGE_MONTHS} months) to load the summary.`
            : "Unable to load summary."}
        </p>
      )}
    </div>
  );
}
