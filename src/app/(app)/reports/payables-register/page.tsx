"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReportRegisterExportToolbar } from "@/components/reports/ReportRegisterExportToolbar";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import {
  ReportRegisterEmptyRow,
  ReportRegisterResultBar,
  ReportRegisterSearchCard,
  ReportRegisterSummaryCard,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { usePayablesRegister } from "@/hooks/use-reports";
import { DEFAULT_REPORT_LIMIT } from "@/constants";
import { REGISTER_FLOAT_EPS } from "@/lib/reports/invoice-register-filters";
import { reportPayablesRegister } from "@/lib/reports/report-labels";
import { cn, formatCurrency } from "@/lib/core/utils";
import type { Party } from "@/types/party";
import type { PayablesRegisterPartyRow } from "@/types/report";

interface Filters {
  supplierParty: Party | null;
}

const EMPTY_FILTERS: Filters = { supplierParty: null };

function num(s: string): number {
  const n = parseFloat(String(s ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function sumPayablesRows(rows: PayablesRegisterPartyRow[]) {
  return rows.reduce(
    (acc, p) => ({
      payable: acc.payable + num(p.payableAmount),
      invoiced: acc.invoiced + num(p.totalInvoiced),
      paid: acc.paid + num(p.totalPaid),
    }),
    { payable: 0, invoiced: 0, paid: 0 },
  );
}

export default function PayablesRegisterPage() {
  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  const { data, isPending, error } = usePayablesRegister(limit);
  const exportQuery = useMemo(() => ({ limit }), [limit]);

  const rows = useMemo(() => {
    const all = data?.parties ?? [];
    const party = applied.supplierParty;
    if (!party) return all;
    return all.filter((p) => p.partyId === party.id);
  }, [data?.parties, applied.supplierParty]);

  const isFiltered = applied.supplierParty != null;
  const totals = useMemo(() => sumPayablesRows(rows), [rows]);

  const summary = data?.summary;
  const creditorCount = isFiltered ? rows.length : (summary?.creditorCount ?? 0);
  const totalPayableStr = isFiltered
    ? String(totals.payable.toFixed(2))
    : (summary?.totalPayable ?? "0");

  const handleSearch = () => setApplied({ ...draft });
  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  const rowCount = rows.length;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportPayablesRegister.title}
        description={reportPayablesRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportPayablesRegister.loadError} />

      <ReportRegisterSearchCard>
        <div className="mb-3 grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <ReportLimitInput value={limit} onChange={setLimit} stacked />
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Supplier / party</Label>
            <PartyAutocomplete
              value={draft.supplierParty}
              onValueChange={(p) => setDraft((d) => ({ ...d, supplierParty: p }))}
              serverSearch
              partiesQueryType="SUPPLIER"
              placeholder="Type to search suppliers…"
              className="h-8"
              inputId="payables-register-supplier"
            />
            <p className="text-[10px] leading-snug text-muted-foreground">
              Row limit loads from the server; pick a supplier and click Search to filter this list.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!isFiltered && !draft.supplierParty}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
          <Button type="button" size="sm" onClick={handleSearch} className="min-w-[90px]">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Search
          </Button>
        </div>
      </ReportRegisterSearchCard>

      {isPending ? (
        <ReportTabSkeleton layout="register-with-toolbar" />
      ) : data ? (
        <div className="space-y-2">
          <ReportRegisterSummaryCard variant="rose">
            <p className="text-muted-foreground">
              <span>{reportPayablesRegister.summaryTotalLabel} </span>
              <span className="text-lg font-semibold tabular-nums text-rose-900 dark:text-rose-100">
                {formatCurrency(totalPayableStr)}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reportPayablesRegister.summaryParties(creditorCount)}
              {isFiltered ? (
                <span className="text-foreground/80">
                  {" "}
                  · From {data?.parties?.length ?? 0} parties in this load
                </span>
              ) : null}
            </p>
          </ReportRegisterSummaryCard>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{rowCount}</span>
              {rowCount === 1 ? "party" : "parties"}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
            <ReportRegisterExportToolbar
              reportPath="/reports/payables-register"
              query={exportQuery}
              csvFilename={reportPayablesRegister.csvFilename}
              pdfFilename={reportPayablesRegister.pdfFilename}
              xlsxFilename={reportPayablesRegister.xlsxFilename}
            />
          </div>

          <ReportRegisterTableScroll>
            <ReportRegisterResultBar count={rowCount} rowLabel="parties shown" limit={limit} />
            <table className={cn(rr.table, "min-w-[720px]")}>
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
                    message={
                      isFiltered
                        ? "No party matches this supplier. Try another name or clear the filter."
                        : reportPayablesRegister.emptyMessage
                    }
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
                        className={cn(
                          rr.tdRight,
                          "font-semibold",
                          num(p.payableAmount) > REGISTER_FLOAT_EPS
                            ? "text-rose-800 dark:text-rose-300"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatCurrency(p.payableAmount)}
                      </td>
                      <td className={rr.tdRightMuted}>{formatCurrency(p.totalInvoiced)}</td>
                      <td className={rr.tdRightMuted}>{formatCurrency(p.totalPaid)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {rowCount > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Total — {rowCount} {rowCount === 1 ? "party" : "parties"}
                    </td>
                    <td
                      className={cn(
                        rr.tdRight,
                        "font-bold",
                        totals.payable > REGISTER_FLOAT_EPS
                          ? "text-rose-800 dark:text-rose-300"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatCurrency(String(totals.payable.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {formatCurrency(String(totals.invoiced.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {formatCurrency(String(totals.paid.toFixed(2)))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </ReportRegisterTableScroll>
        </div>
      ) : null}
    </div>
  );
}
