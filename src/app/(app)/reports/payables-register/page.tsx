"use client";

import { useState } from "react";
import Link from "next/link";
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
  ReportRegisterSummaryCard,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { usePayablesRegister } from "@/hooks/use-reports";
import { DEFAULT_REPORT_LIMIT } from "@/constants";
import { reportPayablesRegister } from "@/lib/reports/report-labels";
import { cn, formatCurrency } from "@/lib/core/utils";

export default function PayablesRegisterPage() {
  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);
  const { data, isPending, error } = usePayablesRegister(limit);

  const rows = data?.parties ?? [];
  const rowCount = rows.length;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportPayablesRegister.title}
        description={reportPayablesRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
        action={
          <ReportCsvButton
            reportPath="/reports/payables-register"
            query={{ limit }}
            filename={reportPayablesRegister.csvFilename}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage={reportPayablesRegister.loadError} />

      <ReportRegisterFilterCard>
        <ReportRegisterFilterGrid cols={1}>
          <ReportRegisterFilterGroup>
            <ReportLimitInput value={limit} onChange={setLimit} stacked />
          </ReportRegisterFilterGroup>
        </ReportRegisterFilterGrid>
      </ReportRegisterFilterCard>

      {isPending ? (
        <ReportTabSkeleton layout="balance-register" />
      ) : data ? (
        <div className="space-y-4">
          <ReportRegisterSummaryCard variant="rose">
            <p className="text-muted-foreground">
              <span>{reportPayablesRegister.summaryTotalLabel} </span>
              <span className="text-lg font-semibold tabular-nums text-rose-900 dark:text-rose-100">
                {formatCurrency(data.summary.totalPayable)}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reportPayablesRegister.summaryParties(data.summary.creditorCount)}
            </p>
          </ReportRegisterSummaryCard>

          <ReportRegisterTableScroll>
            <ReportRegisterResultBar count={rowCount} rowLabel="parties listed" limit={limit} />
            <table className={rr.table}>
              <thead className={rr.thead}>
                <tr>
                  <th className={rr.th}>Party</th>
                  <th className={rr.th}>Type</th>
                  <th className={rr.thRight}>We owe</th>
                  <th className={rr.thRight}>Invoiced</th>
                  <th className={rr.thRight}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {rowCount === 0 ? (
                  <ReportRegisterEmptyRow
                    colSpan={5}
                    message={reportPayablesRegister.emptyMessage}
                  />
                ) : (
                  rows.map((p) => (
                    <tr key={p.partyId} className={rr.tr}>
                      <td className={rr.td}>
                        <Link href={`/parties/${p.partyId}/ledger`} className={rr.link}>
                          {p.partyName}
                        </Link>
                      </td>
                      <td className={rr.tdMuted}>{p.type}</td>
                      <td
                        className={cn(rr.tdRight, "font-semibold text-rose-800 dark:text-rose-300")}
                      >
                        {formatCurrency(p.payableAmount)}
                      </td>
                      <td className={rr.tdRightMuted}>{formatCurrency(p.totalInvoiced)}</td>
                      <td className={rr.tdRightMuted}>{formatCurrency(p.totalPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ReportRegisterTableScroll>
        </div>
      ) : null}
    </div>
  );
}
