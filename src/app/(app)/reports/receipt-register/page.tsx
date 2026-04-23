"use client";

import { useState } from "react";
import Link from "next/link";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
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
import { useReceiptRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportReceiptRegister } from "@/lib/reports/report-labels";
import { capitaliseWords, formatCurrency, formatDate } from "@/lib/core/utils";

export default function ReceiptRegisterPage() {
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
  const { data, isPending, error } = useReceiptRegister(validStartDate, validEndDate, limit);

  const rows = data?.receipts ?? [];
  const rowCount = rows.length;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportReceiptRegister.title}
        description={reportReceiptRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
        action={
          <ReportCsvButton
            reportPath="/reports/receipt-register"
            query={{ startDate: validStartDate, endDate: validEndDate, limit }}
            filename={reportReceiptRegister.csvFilename}
            disabled={!validStartDate || !validEndDate}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage={reportReceiptRegister.loadError} />

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
        <ReportTabSkeleton />
      ) : data ? (
        <ReportRegisterTableScroll>
          <ReportRegisterResultBar
            count={rowCount}
            rowLabel="receipts in this period"
            limit={limit}
          />
          <table className={rr.table}>
            <thead className={rr.thead}>
              <tr>
                <th className={rr.th}>Receipt</th>
                <th className={rr.th}>Party</th>
                <th className={rr.thRight}>Total</th>
                <th className={rr.thRight}>Allocated</th>
                <th className={rr.thRight}>Opening tag</th>
                <th className={rr.thRight}>Unallocated</th>
                <th className={rr.th}>Method</th>
                <th className={rr.th}>Received</th>
              </tr>
            </thead>
            <tbody>
              {rowCount === 0 ? (
                <ReportRegisterEmptyRow
                  colSpan={8}
                  message="No receipts in this period. Try widening the date range or record a receipt first."
                />
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className={rr.tr}>
                    <td className={rr.td}>
                      <Link href={`/receipts/${r.id}`} className={rr.link}>
                        {r.receiptNumber}
                      </Link>
                    </td>
                    <td className={rr.td}>{r.partyName ?? "—"}</td>
                    <td className={rr.tdRight}>{formatCurrency(r.totalAmount)}</td>
                    <td className={rr.tdRightMuted}>{formatCurrency(r.allocatedAmount ?? "0")}</td>
                    <td className={rr.tdRightMuted}>
                      {r.openingBalanceSettlementAmount != null &&
                      parseFloat(String(r.openingBalanceSettlementAmount)) > 0.001
                        ? formatCurrency(String(r.openingBalanceSettlementAmount))
                        : "—"}
                    </td>
                    <td className={rr.tdRight}>{formatCurrency(r.unallocatedAmount)}</td>
                    <td className={rr.tdMuted}>
                      {r.paymentMethod
                        ? capitaliseWords(String(r.paymentMethod).replace(/_/g, " "))
                        : "—"}
                    </td>
                    <td className={rr.tdMuted}>{formatDate(r.receivedAt)}</td>
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
