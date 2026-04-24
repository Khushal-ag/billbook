"use client";

import { useMemo, useState } from "react";
import { LinkedInvoiceLink } from "@/components/invoices/LinkedInvoiceLink";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreditNoteRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportCreditNoteRegister } from "@/lib/reports/report-labels";
import { cn, formatCurrency, formatDate } from "@/lib/core/utils";

export default function CreditNoteRegisterPage() {
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
  const { data, isPending, error } = useCreditNoteRegister(validStartDate, validEndDate, limit);

  const rows = data?.creditNotes ?? [];
  const rowCount = rows.length;

  const exportQuery = useMemo(
    () => ({
      startDate: validStartDate,
      endDate: validEndDate,
      limit,
    }),
    [validStartDate, validEndDate, limit],
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportCreditNoteRegister.title}
        description={reportCreditNoteRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportCreditNoteRegister.loadError} />

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
              reportPath="/reports/credit-note-register"
              query={exportQuery}
              csvFilename={reportCreditNoteRegister.csvFilename}
              pdfFilename={reportCreditNoteRegister.pdfFilename}
              xlsxFilename={reportCreditNoteRegister.xlsxFilename}
              disabled={!validStartDate || !validEndDate}
            />
          </div>
          <ReportRegisterTableScroll>
            <ReportRegisterResultBar
              count={rowCount}
              rowLabel="credit notes in this period"
              limit={limit}
            />
            <table className={rr.table}>
              <thead className={rr.thead}>
                <tr>
                  <th className={rr.th}>Credit note</th>
                  <th className={rr.th}>Status</th>
                  <th className={rr.th}>Party</th>
                  <th className={rr.th}>Invoice</th>
                  <th className={rr.thRight}>Amount</th>
                  <th className={rr.th}>Inventory</th>
                  <th className={rr.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {rowCount === 0 ? (
                  <ReportRegisterEmptyRow
                    colSpan={7}
                    message="No credit notes in this period. Adjust dates or create a credit note."
                  />
                ) : (
                  rows.map((cnRow) => (
                    <tr key={cnRow.id} className={rr.tr}>
                      <td className={cn(rr.td, "font-medium tabular-nums")}>
                        {cnRow.creditNoteNumber}
                      </td>
                      <td className={rr.td}>
                        <StatusBadge status={cnRow.status} />
                      </td>
                      <td className={rr.td}>{cnRow.partyName ?? "—"}</td>
                      <td className={rr.td}>
                        {cnRow.invoiceId ? (
                          <LinkedInvoiceLink
                            invoiceId={cnRow.invoiceId}
                            invoiceNumber={cnRow.invoiceNumber}
                            className={rr.link}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={cn(rr.tdRight, "font-medium")}>
                        {formatCurrency(cnRow.totalAmount)}
                      </td>
                      <td className={rr.tdMuted}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">
                                {cnRow.affectsInventory === undefined
                                  ? "—"
                                  : cnRow.affectsInventory
                                    ? "Yes *"
                                    : "No"}
                              </span>
                            </TooltipTrigger>
                            {cnRow.affectsInventory && (
                              <TooltipContent side="top" className="max-w-[220px] text-xs">
                                Coming soon — inventory adjustment is not yet automated.
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className={rr.tdMuted}>{formatDate(cnRow.createdAt)}</td>
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
