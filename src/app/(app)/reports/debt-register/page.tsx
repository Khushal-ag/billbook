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
import { useDebtRegister } from "@/hooks/use-reports";
import { DEFAULT_REPORT_LIMIT } from "@/constants";
import { reportDebtRegister } from "@/lib/reports/report-labels";
import { cn, formatCurrency } from "@/lib/core/utils";

export default function DebtRegisterPage() {
  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);
  const { data, isPending, error } = useDebtRegister(limit);

  const rows = data?.parties ?? [];
  const rowCount = rows.length;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportDebtRegister.title}
        description={reportDebtRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
        action={
          <ReportCsvButton
            reportPath="/reports/debt-register"
            query={{ limit }}
            filename={reportDebtRegister.csvFilename}
          />
        }
      />

      <ErrorBanner error={error} fallbackMessage={reportDebtRegister.loadError} />

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
          <ReportRegisterSummaryCard variant="emerald">
            <p className="text-muted-foreground">
              <span>{reportDebtRegister.summaryTotalLabel} </span>
              <span className="text-lg font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                {formatCurrency(data.summary.totalReceivable)}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reportDebtRegister.summaryParties(data.summary.debtorCount)}
            </p>
          </ReportRegisterSummaryCard>

          <ReportRegisterTableScroll>
            <ReportRegisterResultBar count={rowCount} rowLabel="parties listed" limit={limit} />
            <table className={rr.table}>
              <thead className={rr.thead}>
                <tr>
                  <th className={rr.th}>Party</th>
                  <th className={rr.th}>Type</th>
                  <th className={rr.thRight}>Outstanding</th>
                  <th className={rr.thRight}>Invoiced</th>
                  <th className={rr.thRight}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {rowCount === 0 ? (
                  <ReportRegisterEmptyRow colSpan={5} message={reportDebtRegister.emptyMessage} />
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
                        className={cn(
                          rr.tdRight,
                          "font-semibold text-emerald-800 dark:text-emerald-300",
                        )}
                      >
                        {formatCurrency(p.outstanding)}
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
