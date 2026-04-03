"use client";

import { useState } from "react";
import Link from "next/link";
import DateRangePicker from "@/components/DateRangePicker";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { ReportBackLink } from "@/components/reports/ReportBackLink";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreditNoteRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

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

  return (
    <div className="page-container animate-fade-in">
      <ReportBackLink />
      <PageHeader
        title="Credit note register"
        description="Credit notes created in the selected period"
        action={
          <ReportCsvButton
            reportPath="/reports/credit-note-register"
            query={{ startDate: validStartDate, endDate: validEndDate, limit }}
            filename="credit-note-register.csv"
            disabled={!validStartDate || !validEndDate}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load credit note register" />

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
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Credit note
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Party</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Invoice</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Inventory</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {(data.creditNotes ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    No credit notes in this period.
                  </td>
                </tr>
              ) : (
                data.creditNotes.map((cn) => (
                  <tr key={cn.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{cn.creditNoteNumber}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={cn.status} />
                    </td>
                    <td className="px-3 py-2">{cn.partyName ?? "—"}</td>
                    <td className="px-3 py-2">
                      {cn.invoiceId ? (
                        <Link
                          href={`/invoices/${cn.invoiceId}`}
                          className="text-accent underline-offset-4 hover:underline"
                        >
                          {cn.invoiceNumber ?? `#${cn.invoiceId}`}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(cn.totalAmount)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {cn.affectsInventory === undefined
                                ? "—"
                                : cn.affectsInventory
                                  ? "Yes *"
                                  : "No"}
                            </span>
                          </TooltipTrigger>
                          {cn.affectsInventory && (
                            <TooltipContent side="top" className="max-w-[220px] text-xs">
                              Coming soon — inventory adjustment is not yet automated.
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(cn.createdAt)}</td>
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
