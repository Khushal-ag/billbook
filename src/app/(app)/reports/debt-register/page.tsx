"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RotateCcw, Search } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportRegisterExportToolbar } from "@/components/reports/ReportRegisterExportToolbar";
import {
  ReportRegisterEmptyRow,
  ReportRegisterResultBar,
  ReportRegisterSearchCard,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { useReceivablesAging } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportDebtRegister } from "@/lib/reports/report-labels";
import { parseISODateString, formatISODateDisplay } from "@/lib/core/date";
import { cn, formatCurrency, formatDate } from "@/lib/core/utils";
import type { ReceivablesAgingBucket, ReceivablesAgingLine } from "@/types/report";
import type { Party } from "@/types/party";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";

const MONEY_EPS = 0.001;
type OutstandingFilter = "ALL" | "UNPAID" | "PARTIAL";

function num(s: string | null | undefined): number {
  const n = parseFloat(String(s ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function returnNum(line: ReceivablesAgingLine): number {
  return Math.max(0, num(line.returnAmount));
}

function netAmountNum(line: ReceivablesAgingLine): number {
  return Math.max(0, num(line.totalAmount) - returnNum(line));
}

/** Unpaid = nothing paid toward the invoice; partial = some paid but balance remains. */
function outstandingKind(line: ReceivablesAgingLine): Exclude<OutstandingFilter, "ALL"> {
  const paid = num(line.paidAmount);
  if (paid <= MONEY_EPS) return "UNPAID";
  return "PARTIAL";
}

function daysFromInvoiceToAsOf(invoiceDate: string, asOfYmd: string): number {
  const inv = parseISODateString(String(invoiceDate).slice(0, 10));
  const asOf = parseISODateString(asOfYmd);
  if (!inv || !asOf) return 0;
  return Math.round((asOf.getTime() - inv.getTime()) / 86400000);
}

/** Place row balance in the ageing bucket column (matches wireframe layout). */
function bucketAmounts(line: ReceivablesAgingLine): [number, number, number, number] {
  const due = num(line.dueAmount);
  if (due <= MONEY_EPS) return [0, 0, 0, 0];
  const b: ReceivablesAgingBucket = line.agingBucket;
  if (b === "CURRENT" || b === "DAYS_1_30") return [due, 0, 0, 0];
  if (b === "DAYS_31_60") return [0, due, 0, 0];
  if (b === "DAYS_61_90") return [0, 0, due, 0];
  return [0, 0, 0, due];
}

interface Filters {
  invoiceNo: string;
  customerParty: Party | null;
  outstanding: OutstandingFilter;
}

const EMPTY_FILTERS: Filters = {
  invoiceNo: "",
  customerParty: null,
  outstanding: "ALL",
};

const AGING_PATH = "/reports/receivables-aging";

export default function DebtRegisterPage() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useDateRange({ maxMonths: MAX_REPORT_DATE_RANGE_MONTHS });

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  const { data, isPending, error } = useReceivablesAging(validEndDate, DEFAULT_REPORT_LIMIT);

  const exportQuery = useMemo(
    () => ({ asOf: validEndDate, limit: DEFAULT_REPORT_LIMIT }),
    [validEndDate],
  );

  const rows = useMemo(() => {
    if (!data?.lines) return [];
    return data.lines.filter((line) => {
      const invYmd = String(line.invoiceDate).slice(0, 10);
      if (validStartDate && invYmd < validStartDate) return false;
      if (
        applied.invoiceNo.trim() &&
        !line.invoiceNumber.toLowerCase().includes(applied.invoiceNo.trim().toLowerCase())
      ) {
        return false;
      }
      if (applied.customerParty && line.partyId !== applied.customerParty.id) {
        return false;
      }
      if (applied.outstanding === "ALL") return true;
      return outstandingKind(line) === applied.outstanding;
    });
  }, [data?.lines, applied, validStartDate]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, line) => {
        const ret = returnNum(line);
        const net = netAmountNum(line);
        const paid = num(line.paidAmount);
        const due = num(line.dueAmount);
        const [b0, b1, b2, b3] = bucketAmounts(line);
        return {
          total: acc.total + num(line.totalAmount),
          ret: acc.ret + ret,
          net: acc.net + net,
          paid: acc.paid + paid,
          balance: acc.balance + due,
          b0: acc.b0 + b0,
          b1: acc.b1 + b1,
          b2: acc.b2 + b2,
          b3: acc.b3 + b3,
        };
      },
      { total: 0, ret: 0, net: 0, paid: 0, balance: 0, b0: 0, b1: 0, b2: 0, b3: 0 },
    );
  }, [rows]);

  const handleSearch = () => setApplied({ ...draft });
  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };
  const isFiltered =
    !!applied.invoiceNo.trim() || applied.customerParty != null || applied.outstanding !== "ALL";

  const colCount = 14;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportDebtRegister.title}
        description={reportDebtRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportDebtRegister.loadError} />

      <ReportRegisterSearchCard>
        <div className="mb-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            From date / Up to date
          </p>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            error={dateRangeError}
            compact
          />
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Balances are as of <span className="font-medium text-foreground">Up to</span> (aging
            snapshot). <span className="font-medium text-foreground">From</span> filters by invoice
            date. Max {MAX_REPORT_DATE_RANGE_MONTHS} months.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Invoice no.</Label>
            <Input
              className="h-8"
              value={draft.invoiceNo}
              onChange={(e) => setDraft((d) => ({ ...d, invoiceNo: e.target.value }))}
              placeholder="Search by invoice number"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-end justify-between gap-2">
              <Label className="text-xs font-medium text-muted-foreground">Outstanding</Label>
              <span className="text-[10px] font-medium uppercase text-muted-foreground/80">
                Optional
              </span>
            </div>
            <Select
              value={draft.outstanding}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, outstanding: v as OutstandingFilter }))
              }
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partially paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
            <PartyAutocomplete
              value={draft.customerParty}
              onValueChange={(p) => setDraft((d) => ({ ...d, customerParty: p }))}
              serverSearch
              partiesQueryType="CUSTOMER"
              placeholder="Type to search customers…"
              className="h-8"
              inputId="debt-register-customer"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={
              !isFiltered && !draft.invoiceNo && !draft.customerParty && draft.outstanding === "ALL"
            }
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            disabled={!validEndDate}
            className="min-w-[100px]"
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Search
          </Button>
        </div>
      </ReportRegisterSearchCard>

      {isPending ? (
        <ReportTabSkeleton layout="register-with-toolbar" />
      ) : data && validEndDate ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground shadow-sm">
            As of{" "}
            <span className="font-medium text-foreground">{formatISODateDisplay(data.asOf)}</span>
            {validStartDate ? (
              <>
                {" · "}
                Invoice date on or after{" "}
                <span className="font-medium text-foreground">
                  {formatISODateDisplay(validStartDate)}
                </span>
              </>
            ) : null}
            {" · "}
            {reportDebtRegister.summaryTotalLabel}{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatCurrency(String(totals.balance.toFixed(2)))}
            </span>
            <span className="text-xs"> ({reportDebtRegister.summaryParties(rows.length)})</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{rows.length}</span>{" "}
              {rows.length === 1 ? "row" : "rows"}
              {isFiltered && rows.length !== data.lines.length ? (
                <span className="text-xs"> (filtered)</span>
              ) : null}
            </p>
            <ReportRegisterExportToolbar
              reportPath={AGING_PATH}
              query={exportQuery}
              csvFilename={reportDebtRegister.csvFilename}
              pdfFilename={reportDebtRegister.pdfFilename}
              xlsxFilename={reportDebtRegister.xlsxFilename}
              disabled={!validEndDate}
            />
          </div>

          <ReportRegisterTableScroll>
            <ReportRegisterResultBar
              count={rows.length}
              rowLabel="invoices in snapshot"
              limit={DEFAULT_REPORT_LIMIT}
            />
            <table className={cn(rr.table, "min-w-[1180px]")}>
              <thead className={rr.thead}>
                <tr>
                  <th className={rr.th}>S. no.</th>
                  <th className={rr.th}>Customer</th>
                  <th className={rr.th}>Invoice no.</th>
                  <th className={rr.th}>Invoice date</th>
                  <th className={rr.thRight} title="Original invoice amount">
                    Total
                  </th>
                  <th className={rr.thRight} title="Linked sale returns (when provided by API)">
                    Return
                  </th>
                  <th className={rr.thRight} title="Total − return">
                    Net
                  </th>
                  <th className={rr.thRight} title="Receipts / credits applied">
                    Paid
                  </th>
                  <th className={rr.thRight} title="Net − paid">
                    Balance
                  </th>
                  <th className={rr.thRight} title="Days from invoice date to as-of date">
                    Days
                  </th>
                  <th className={rr.thRight}>0–30</th>
                  <th className={rr.thRight}>31–60</th>
                  <th className={rr.thRight}>61–90</th>
                  <th className={rr.thRight}>90+</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <ReportRegisterEmptyRow
                    colSpan={colCount}
                    message={reportDebtRegister.emptyMessage}
                  />
                ) : (
                  rows.map((line, idx) => {
                    const ret = returnNum(line);
                    const net = netAmountNum(line);
                    const [b0, b1, b2, b3] = bucketAmounts(line);
                    const days = daysFromInvoiceToAsOf(line.invoiceDate, data.asOf);
                    return (
                      <tr key={`${line.invoiceId}-${idx}`} className={rr.tr}>
                        <td className={rr.tdMuted}>{idx + 1}</td>
                        <td className={rr.td}>
                          {line.partyId ? (
                            <Link href={`/parties/${line.partyId}/ledger`} className={rr.link}>
                              {line.partyName}
                            </Link>
                          ) : (
                            line.partyName
                          )}
                        </td>
                        <td className={rr.td}>
                          <Link href={`/invoices/${line.invoiceId}`} className={rr.link}>
                            {line.invoiceNumber}
                          </Link>
                        </td>
                        <td className={rr.tdMuted}>{formatDate(line.invoiceDate)}</td>
                        <td className={rr.tdRight}>{formatCurrency(line.totalAmount)}</td>
                        <td className={rr.tdRightMuted}>
                          {ret > MONEY_EPS ? formatCurrency(String(ret.toFixed(2))) : "—"}
                        </td>
                        <td className={rr.tdRight}>{formatCurrency(String(net.toFixed(2)))}</td>
                        <td className={rr.tdRightMuted}>{formatCurrency(line.paidAmount)}</td>
                        <td className={cn(rr.tdRight, "font-medium")}>
                          {formatCurrency(line.dueAmount)}
                        </td>
                        <td className={rr.tdRightMuted}>{days}</td>
                        <td className={rr.tdRightMuted}>
                          {b0 > MONEY_EPS ? formatCurrency(String(b0.toFixed(2))) : "—"}
                        </td>
                        <td className={rr.tdRightMuted}>
                          {b1 > MONEY_EPS ? formatCurrency(String(b1.toFixed(2))) : "—"}
                        </td>
                        <td className={rr.tdRightMuted}>
                          {b2 > MONEY_EPS ? formatCurrency(String(b2.toFixed(2))) : "—"}
                        </td>
                        <td className={rr.tdRightMuted}>
                          {b3 > MONEY_EPS ? formatCurrency(String(b3.toFixed(2))) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/50">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Total
                    </td>
                    <td className={cn(rr.tdRight, "font-bold text-foreground")}>
                      {formatCurrency(String(totals.total.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {totals.ret > MONEY_EPS ? formatCurrency(String(totals.ret.toFixed(2))) : "—"}
                    </td>
                    <td className={cn(rr.tdRight, "font-bold text-foreground")}>
                      {formatCurrency(String(totals.net.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {formatCurrency(String(totals.paid.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRight, "font-bold text-foreground")}>
                      {formatCurrency(String(totals.balance.toFixed(2)))}
                    </td>
                    <td className={rr.tdRightMuted} />
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {totals.b0 > MONEY_EPS ? formatCurrency(String(totals.b0.toFixed(2))) : "—"}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {totals.b1 > MONEY_EPS ? formatCurrency(String(totals.b1.toFixed(2))) : "—"}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {totals.b2 > MONEY_EPS ? formatCurrency(String(totals.b2.toFixed(2))) : "—"}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {totals.b3 > MONEY_EPS ? formatCurrency(String(totals.b3.toFixed(2))) : "—"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </ReportRegisterTableScroll>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Choose a valid date range (up to date drives the snapshot) and click Search.
        </p>
      )}
    </div>
  );
}
