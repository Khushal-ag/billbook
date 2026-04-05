"use client";

import { useState } from "react";
import Link from "next/link";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportBackLink } from "@/components/reports/ReportBackLink";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import {
  ReportRegisterEmptyRow,
  ReportRegisterFilterCard,
  ReportRegisterResultBar,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { usePayoutRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { cn, capitaliseWords, formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportPayoutRegister } from "@/lib/report-labels";
import type { PayoutRegisterRowDto } from "@/types/report";

function payoutDisplayNumber(p: PayoutRegisterRowDto) {
  return p.paymentNumber ?? p.payoutNumber ?? "—";
}

function payoutCategoryLabel(p: PayoutRegisterRowDto) {
  const raw = p.paymentCategory ?? p.category;
  if (!raw) return "—";
  return capitaliseWords(String(raw).replace(/_/g, " "));
}

function payoutMethodLabel(method: string | undefined) {
  if (!method) return "—";
  return capitaliseWords(String(method).replace(/_/g, " "));
}

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

  const rows = data?.payouts ?? [];
  const rowCount = rows.length;

  return (
    <div className="page-container animate-fade-in">
      <ReportBackLink />
      <PageHeader
        title={reportPayoutRegister.title}
        description={reportPayoutRegister.description}
        action={
          <ReportCsvButton
            reportPath="/reports/payout-register"
            query={{ startDate: validStartDate, endDate: validEndDate, limit }}
            filename={reportPayoutRegister.csvFilename}
            disabled={!validStartDate || !validEndDate}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage={reportPayoutRegister.loadError} />

      <ReportRegisterFilterCard>
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            error={dateRangeError}
          />
          <ReportLimitInput value={limit} onChange={setLimit} />
        </div>
      </ReportRegisterFilterCard>

      {isPending ? (
        <ReportTabSkeleton />
      ) : data ? (
        <ReportRegisterTableScroll>
          <ReportRegisterResultBar
            count={rowCount}
            rowLabel="payments in this period"
            limit={limit}
          />
          <table className={rr.table}>
            <thead className={rr.thead}>
              <tr>
                <th className={rr.th}>Payment</th>
                <th className={rr.th}>Category</th>
                <th className={rr.th}>Party</th>
                <th className={rr.th}>Invoice</th>
                <th className={rr.thRight}>Amount</th>
                <th className={rr.th}>Method</th>
                <th className={rr.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rowCount === 0 ? (
                <ReportRegisterEmptyRow
                  colSpan={7}
                  message="No payments out in this period. Widen the range or record a payment."
                />
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className={rr.tr}>
                    <td className={cn(rr.td, "font-medium tabular-nums")}>
                      {payoutDisplayNumber(p)}
                    </td>
                    <td className={rr.td}>{payoutCategoryLabel(p)}</td>
                    <td className={rr.td}>{p.partyName ?? p.payeeName ?? "—"}</td>
                    <td className={rr.td}>
                      {p.invoiceId ? (
                        <Link href={`/invoices/${p.invoiceId}`} className={rr.link}>
                          #{p.invoiceId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cn(rr.tdRight, "font-medium")}>{formatCurrency(p.amount)}</td>
                    <td className={rr.tdMuted}>{payoutMethodLabel(p.paymentMethod)}</td>
                    <td className={rr.tdMuted}>{formatDate(p.paidAt ?? p.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ReportRegisterTableScroll>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Select a valid date range to load data.
        </p>
      )}
    </div>
  );
}
