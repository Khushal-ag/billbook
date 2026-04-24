"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportRegisterExportToolbar } from "@/components/reports/ReportRegisterExportToolbar";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import {
  ReportRegisterEmptyRow,
  ReportRegisterFilterCard,
  ReportRegisterFilterGrid,
  ReportRegisterFilterGroup,
  ReportRegisterResultBar,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { usePayoutRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { cn, formatCurrency, formatDate, humanizeApiEnum } from "@/lib/core/utils";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportPayoutRegister } from "@/lib/reports/report-labels";
import type { ClientReportTableExport } from "@/lib/reports/report-table-export";
import type { PayoutRegisterRowDto } from "@/types/report";

function payoutDisplayNumber(p: PayoutRegisterRowDto) {
  return p.paymentNumber ?? p.payoutNumber ?? "—";
}

function payoutCategoryLabel(p: PayoutRegisterRowDto) {
  const raw = p.paymentCategory ?? p.category;
  if (!raw) return "—";
  return humanizeApiEnum(String(raw)) || "—";
}

function payoutMethodLabel(method: string | undefined) {
  if (!method) return "—";
  return humanizeApiEnum(String(method)) || "—";
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

  const rows = useMemo(() => data?.payouts ?? [], [data?.payouts]);
  const rowCount = rows.length;

  const exportQuery = useMemo(
    () => ({
      startDate: validStartDate,
      endDate: validEndDate,
      limit,
    }),
    [validStartDate, validEndDate, limit],
  );

  const clientTableExport = useMemo((): ClientReportTableExport | null => {
    if (!data) return null;
    const headers = [
      "Payment",
      "Category",
      "Party",
      "Invoice",
      "Amount",
      "Method",
      "Date",
    ] as const;
    const body = rows.map((p) => [
      payoutDisplayNumber(p),
      payoutCategoryLabel(p),
      p.partyName ?? p.payeeName ?? "—",
      p.invoiceId ? `#${p.invoiceId}` : "—",
      formatCurrency(p.amount),
      payoutMethodLabel(p.paymentMethod),
      formatDate(p.paidAt ?? p.createdAt),
    ]);
    return {
      reportTitle: reportPayoutRegister.title,
      subtitle: `Period ${formatDate(data.period.startDate)} – ${formatDate(data.period.endDate)}`,
      headers: [...headers],
      rows: body,
    };
  }, [data, rows]);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportPayoutRegister.title}
        description={reportPayoutRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportPayoutRegister.loadError} />

      <ReportRegisterFilterCard>
        <ReportRegisterFilterGrid cols={2}>
          <ReportRegisterFilterGroup title="Period">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              error={dateRangeError}
              compact
            />
          </ReportRegisterFilterGroup>
          <ReportRegisterFilterGroup>
            <ReportLimitInput value={limit} onChange={setLimit} stacked />
          </ReportRegisterFilterGroup>
        </ReportRegisterFilterGrid>
      </ReportRegisterFilterCard>

      {isPending ? (
        <ReportTabSkeleton layout="register-with-toolbar" />
      ) : data ? (
        <div className="space-y-2">
          <div className="flex flex-wrap justify-end gap-2">
            <ReportRegisterExportToolbar
              reportPath="/reports/payout-register"
              query={exportQuery}
              csvFilename={reportPayoutRegister.csvFilename}
              pdfFilename={reportPayoutRegister.pdfFilename}
              xlsxFilename={reportPayoutRegister.xlsxFilename}
              clientTableExport={clientTableExport}
              disabled={!validStartDate || !validEndDate}
            />
          </div>
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
                    message="No payouts in this period. Widen the date range or record a payout from Payouts."
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
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Select a valid date range to load data.
        </p>
      )}
    </div>
  );
}
