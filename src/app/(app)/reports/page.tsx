"use client";

import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportsDashboardSection } from "@/components/reports/ReportsDashboardSection";
import { ReportsDashboardSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { useReportsDashboard } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportHub } from "@/lib/reports/report-labels";

export default function ReportsPage() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useDateRange({ maxMonths: MAX_REPORT_DATE_RANGE_MONTHS });

  const { data, isPending, error } = useReportsDashboard(validStartDate, validEndDate);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title={reportHub.title} description={reportHub.description} />

      <ErrorBanner error={error} fallbackMessage="Failed to load reports summary" />

      <div className="mb-5 flex flex-col gap-3 border-b border-border/50 pb-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:pb-4">
        <DateRangePicker
          compact
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          error={dateRangeError}
        />
        <p className="text-pretty text-[11px] leading-relaxed text-muted-foreground sm:min-w-0 sm:max-w-[20rem] sm:flex-1 sm:self-center lg:max-w-md">
          Max {MAX_REPORT_DATE_RANGE_MONTHS} months. Totals in this section use the dates you pick;
          money owed uses each party’s current balance (always up to date).
        </p>
      </div>

      {isPending ? (
        <ReportsDashboardSkeleton />
      ) : data ? (
        <ReportsDashboardSection data={data} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/10 py-8 text-center text-sm text-muted-foreground">
          Select a valid date range (max {MAX_REPORT_DATE_RANGE_MONTHS} months) to load the summary.
        </p>
      )}
    </div>
  );
}
