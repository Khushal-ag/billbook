"use client";

import { useState } from "react";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportBackLink } from "@/components/reports/ReportBackLink";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { usePayoutRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { capitaliseWords, formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";

export default function PayoutRegisterPage() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useDateRange({ maxMonths: MAX_REPORT_DATE_RANGE_MONTHS });

  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);
  const { data, isPending, error } = usePayoutRegister(validStartDate, validEndDate, limit);

  return (
    <div className="page-container animate-fade-in">
      <ReportBackLink />
      <PageHeader
        title="Payout register"
        description="Outbound payments in the selected period"
        action={
          <ReportCsvButton
            reportPath="/reports/payout-register"
            query={{ startDate: validStartDate, endDate: validEndDate, limit }}
            filename="payout-register.csv"
            disabled={!validStartDate || !validEndDate}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load payout register" />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          error={dateRangeError}
        />
        <ReportLimitInput value={limit} onChange={setLimit} />
      </div>

      {isPending ? (
        <ReportTabSkeleton height="h-80" />
      ) : data ? (
        <div className="data-table-container overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Payout</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Party</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data.payouts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    No payouts in this period.
                  </td>
                </tr>
              ) : (
                data.payouts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium tabular-nums">{p.payoutNumber ?? "—"}</td>
                    <td className="px-3 py-2 font-medium">
                      {capitaliseWords(String(p.category).replace(/_/g, " "))}
                    </td>
                    <td className="px-3 py-2">{p.partyName ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{p.paymentMethod ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Select a valid date range to load data.
        </p>
      )}
    </div>
  );
}
