"use client";

import { useState } from "react";
import Link from "next/link";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { useInvoiceRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportInvoiceRegister } from "@/lib/reports/report-labels";
import { cn, capitaliseWords, formatCurrency, formatDate } from "@/lib/core/utils";

export default function InvoiceRegisterPage() {
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
  const [showConsignee, setShowConsignee] = useState(false);
  const { data, isPending, error } = useInvoiceRegister(validStartDate, validEndDate, limit);

  const rows = data?.invoices ?? [];
  const rowCount = rows.length;
  const colSpan = showConsignee ? 8 : 6;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportInvoiceRegister.title}
        description={reportInvoiceRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
        action={
          <ReportCsvButton
            reportPath="/reports/invoice-register"
            query={{ startDate: validStartDate, endDate: validEndDate, limit }}
            filename={reportInvoiceRegister.csvFilename}
            disabled={!validStartDate || !validEndDate}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage={reportInvoiceRegister.loadError} />

      <ReportRegisterFilterCard>
        <ReportRegisterFilterGrid cols={3}>
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

          <ReportRegisterFilterGroup title="Columns">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full justify-start border-dashed px-3 text-sm text-muted-foreground"
              onClick={() => setShowConsignee((v) => !v)}
            >
              {showConsignee ? "Hide" : "Show"} ship-to / consignee
            </Button>
          </ReportRegisterFilterGroup>
        </ReportRegisterFilterGrid>
      </ReportRegisterFilterCard>

      {isPending ? (
        <ReportTabSkeleton />
      ) : data ? (
        <ReportRegisterTableScroll>
          <ReportRegisterResultBar
            count={rowCount}
            rowLabel="invoices in this period"
            limit={limit}
          />
          <table className={rr.table}>
            <thead className={rr.thead}>
              <tr>
                <th className={rr.th}>Invoice</th>
                <th className={rr.th}>Party</th>
                <th className={rr.th}>Status</th>
                <th className={rr.th}>Type</th>
                <th className={rr.th}>Date</th>
                <th className={rr.thRight}>Total</th>
                {showConsignee && (
                  <>
                    <th className={rr.th}>Consignee</th>
                    <th className={rr.th}>City</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rowCount === 0 ? (
                <ReportRegisterEmptyRow
                  colSpan={colSpan}
                  message="No invoices in this period. Adjust the range or create an invoice."
                />
              ) : (
                rows.map((inv) => (
                  <tr key={inv.id} className={rr.tr}>
                    <td className={rr.td}>
                      <Link href={`/invoices/${inv.id}`} className={rr.link}>
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className={rr.td}>{inv.partyName ?? "—"}</td>
                    <td className={rr.td}>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className={rr.tdMuted}>
                      {capitaliseWords(String(inv.invoiceType).replace(/_/g, " "))}
                    </td>
                    <td className={rr.tdMuted}>{formatDate(inv.invoiceDate)}</td>
                    <td className={cn(rr.tdRight, "font-medium")}>
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    {showConsignee && (
                      <>
                        <td className={rr.tdMuted}>{inv.consigneeName ?? "—"}</td>
                        <td className={rr.tdMuted}>{inv.consigneeCity ?? "—"}</td>
                      </>
                    )}
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
