"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw, Search } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useReceiptRegister } from "@/hooks/use-reports";
import { useReceipt } from "@/hooks/use-receipts";
import { useRegisterDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportReceiptRegister } from "@/lib/reports/report-labels";
import type { ClientReportTableExport } from "@/lib/reports/report-table-export";
import { cn, capitaliseWords, formatCurrency, formatDate } from "@/lib/core/utils";
import type { ReceiptRegisterRowDto } from "@/types/report";
import type { Party } from "@/types/party";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { receiptRowMatchesCustomerParty } from "@/lib/reports/receipt-register-party-filter";

const MONEY_EPS = 0.001;
/** Rupee reconciliation: tolerate float noise on totals. */
const MONEY_RECONCILE = 0.05;

type ReceiptKindFilter = "ALL" | "AGAINST_INVOICE" | "ADVANCE";
type AdjustmentFilter = "ALL" | "PAID" | "UNPAID" | "PARTIAL";

function num(s: string | null | undefined): number {
  const n = parseFloat(String(s ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Register rows sometimes send `allocatedAmount` = invoice lines only and put opening in
 * `openingBalanceSettlementAmount` while still `allocated + unallocated = total`. Then total applied
 * money is invoice + opening. When `allocatedAmount` already includes opening, do not add twice.
 */
function totalAppliedAmount(r: ReceiptRegisterRowDto): number {
  const total = num(r.totalAmount);
  const a = num(r.allocatedAmount);
  const u = num(r.unallocatedAmount);
  const op = num(r.openingBalanceSettlementAmount);
  if (Math.abs(a + u - total) > MONEY_RECONCILE) {
    const withOpening = a + op;
    if (Math.abs(withOpening + u - total) < MONEY_RECONCILE) return withOpening;
    return a;
  }
  if (op > MONEY_EPS && a < op - MONEY_EPS) {
    return a + op;
  }
  return a;
}

/** Invoice-only allocation (excludes opening tag), for “Against invoice” filter. */
function invoiceAllocationsOnly(r: ReceiptRegisterRowDto): number {
  const total = num(r.totalAmount);
  const a = num(r.allocatedAmount);
  const u = num(r.unallocatedAmount);
  const op = num(r.openingBalanceSettlementAmount);
  if (Math.abs(a + u - total) > MONEY_RECONCILE) {
    return Math.max(0, a - op);
  }
  if (op > MONEY_EPS && a < op - MONEY_EPS) {
    return a;
  }
  return Math.max(0, a - op);
}

function remainingUnallocatedDisplay(r: ReceiptRegisterRowDto): number {
  return Math.max(0, num(r.totalAmount) - totalAppliedAmount(r));
}

function receiptKind(r: ReceiptRegisterRowDto): Exclude<ReceiptKindFilter, "ALL"> {
  return invoiceAllocationsOnly(r) > MONEY_EPS ? "AGAINST_INVOICE" : "ADVANCE";
}

/** Split report `linkedInvoiceSummary` (comma / semicolon / pipe / slash / newline separated). */
function splitLinkedInvoiceSummary(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const isPlaceholderDash = (s: string) => /^[-–—]+$/.test(s) || /^n\/?a$/i.test(s);
  return raw
    .split(/[,;|/\n]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !isPlaceholderDash(p));
}

/** Comma-separated ref invoice numbers for exports (single column). */
function refInvoicesExportCell(r: ReceiptRegisterRowDto): string {
  const parts = splitLinkedInvoiceSummary(r.linkedInvoiceSummary);
  if (parts.length > 0) return parts.join(", ");
  return "—";
}

function ReceiptRegisterRefInvoicesCell({
  row,
  onOpenDialog,
}: {
  row: ReceiptRegisterRowDto;
  onOpenDialog: () => void;
}) {
  const parts = splitLinkedInvoiceSummary(row.linkedInvoiceSummary);
  const hasInvoiceMoney = invoiceAllocationsOnly(row) > MONEY_EPS;
  const btnClass = cn(
    rr.link,
    "inline-flex max-w-full cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-left text-sm font-medium",
  );
  const arrow = <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />;

  if (parts.length >= 2) {
    return (
      <button
        type="button"
        onClick={onOpenDialog}
        className={btnClass}
        title="View allocated invoices"
      >
        <span className="min-w-0 truncate">Invoices</span>
        {arrow}
      </button>
    );
  }
  if (parts.length === 1) {
    return (
      <button
        type="button"
        onClick={onOpenDialog}
        className={btnClass}
        title="View allocated invoices"
      >
        <span className="min-w-0 truncate">{parts[0]}</span>
        {arrow}
      </button>
    );
  }
  if (hasInvoiceMoney) {
    return (
      <button
        type="button"
        onClick={onOpenDialog}
        className={btnClass}
        title="View allocated invoices"
      >
        <span className="min-w-0 truncate">Invoices</span>
        {arrow}
      </button>
    );
  }
  return <span className="text-sm text-muted-foreground">—</span>;
}

function adjustmentStatus(r: ReceiptRegisterRowDto): Exclude<AdjustmentFilter, "ALL"> {
  const applied = totalAppliedAmount(r);
  const rem = remainingUnallocatedDisplay(r);
  if (rem <= MONEY_EPS) return "PAID";
  if (applied <= MONEY_EPS) return "UNPAID";
  return "PARTIAL";
}

interface Filters {
  receiptNo: string;
  customerParty: Party | null;
  receiptKind: ReceiptKindFilter;
  adjustment: AdjustmentFilter;
}

const EMPTY_FILTERS: Filters = {
  receiptNo: "",
  customerParty: null,
  receiptKind: "ALL",
  adjustment: "ALL",
};

export default function ReceiptRegisterPage() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useRegisterDateRange();

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [limit] = useState(DEFAULT_REPORT_LIMIT);
  const [allocDialogReceiptId, setAllocDialogReceiptId] = useState<number | null>(null);

  const { data, isPending, error } = useReceiptRegister(validStartDate, validEndDate, limit);
  const { data: allocDetail, isPending: allocPending } = useReceipt(
    allocDialogReceiptId ?? undefined,
  );

  const rows = useMemo(
    () =>
      (data?.receipts ?? [])
        .filter((r) =>
          !applied.receiptNo.trim()
            ? true
            : r.receiptNumber.toLowerCase().includes(applied.receiptNo.trim().toLowerCase()),
        )
        .filter((r) => receiptRowMatchesCustomerParty(r, applied.customerParty))
        .filter((r) => {
          if (applied.receiptKind === "ALL") return true;
          return receiptKind(r) === applied.receiptKind;
        })
        .filter((r) => {
          if (applied.adjustment === "ALL") return true;
          return adjustmentStatus(r) === applied.adjustment;
        }),
    [data, applied],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          amount: acc.amount + num(r.totalAmount),
          adjusted: acc.adjusted + totalAppliedAmount(r),
          unadjusted: acc.unadjusted + remainingUnallocatedDisplay(r),
        }),
        { amount: 0, adjusted: 0, unadjusted: 0 },
      ),
    [rows],
  );

  const handleSearch = () => setApplied({ ...draft });
  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };
  const isFiltered =
    !!applied.receiptNo.trim() ||
    applied.customerParty != null ||
    applied.receiptKind !== "ALL" ||
    applied.adjustment !== "ALL";

  const exportQuery = useMemo(
    () => ({ startDate: validStartDate, endDate: validEndDate, limit }),
    [validStartDate, validEndDate, limit],
  );

  const clientTableExport = useMemo((): ClientReportTableExport | null => {
    if (!data) return null;
    const headers = [
      "Date",
      "Receipt no.",
      "Customer",
      "Ref. invoices",
      "Mode",
      "Amount",
      "Adjusted",
      "Unadjusted",
    ] as const;
    const body = rows.map((r) => {
      const adjDisplay = totalAppliedAmount(r);
      const unadjDisplay = remainingUnallocatedDisplay(r);
      const ref = refInvoicesExportCell(r);
      return [
        formatDate(r.receivedAt),
        r.receiptNumber,
        r.partyName ?? "—",
        ref,
        r.paymentMethod ? capitaliseWords(String(r.paymentMethod).replace(/_/g, " ")) : "—",
        formatCurrency(r.totalAmount),
        formatCurrency(String(adjDisplay.toFixed(2))),
        formatCurrency(String(unadjDisplay.toFixed(2))),
      ];
    });
    return {
      reportTitle: reportReceiptRegister.title,
      subtitle: `Period ${formatDate(data.period.startDate)} – ${formatDate(data.period.endDate)}`,
      headers: [...headers],
      rows: body,
    };
  }, [data, rows]);

  const invoiceAllocRows = allocDetail?.allocations?.filter((a) => num(a.amount) > MONEY_EPS) ?? [];
  const openingSettlementOnDetail = num(allocDetail?.openingBalanceSettlementAmount);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportReceiptRegister.title}
        description={reportReceiptRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportReceiptRegister.loadError} />

      <ReportRegisterSearchCard>
        <div className="mb-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Date range
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
            Max {MAX_REPORT_DATE_RANGE_MONTHS} months.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Receipt no.</Label>
            <Input
              className="h-8"
              value={draft.receiptNo}
              onChange={(e) => setDraft((d) => ({ ...d, receiptNo: e.target.value }))}
              placeholder="e.g. RCP-00012"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-end justify-between gap-2">
              <Label className="text-xs font-medium text-muted-foreground">Type</Label>
              <span className="text-[10px] font-medium uppercase text-muted-foreground/80">
                Optional
              </span>
            </div>
            <Select
              value={draft.receiptKind}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, receiptKind: v as ReceiptKindFilter }))
              }
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="AGAINST_INVOICE">Against invoice</SelectItem>
                <SelectItem value="ADVANCE">Advance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
            <PartyAutocomplete
              value={draft.customerParty}
              onValueChange={(p) => setDraft((d) => ({ ...d, customerParty: p }))}
              serverSearch
              partiesQueryType="CUSTOMER"
              placeholder="Type to search customers…"
              className="h-8"
              inputId="receipt-register-customer"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Allocation</Label>
            <Select
              value={draft.adjustment}
              onValueChange={(v) => setDraft((d) => ({ ...d, adjustment: v as AdjustmentFilter }))}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PAID">Fully adjusted</SelectItem>
                <SelectItem value="UNPAID">None adjusted</SelectItem>
                <SelectItem value="PARTIAL">Partly adjusted</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              Filter by how much of the receipt is applied (invoices + opening).
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={
              !isFiltered &&
              !draft.receiptNo &&
              !draft.customerParty &&
              draft.receiptKind === "ALL" &&
              draft.adjustment === "ALL"
            }
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSearch}
            disabled={!validStartDate || !validEndDate}
            className="min-w-[90px]"
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Search
          </Button>
        </div>
      </ReportRegisterSearchCard>

      {isPending ? (
        <ReportTabSkeleton layout="register-with-toolbar" />
      ) : data ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{rows.length}</span>
              {rows.length === 1 ? "record" : "records"}
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
              reportPath="/reports/receipt-register"
              query={exportQuery}
              csvFilename={reportReceiptRegister.csvFilename}
              pdfFilename={reportReceiptRegister.pdfFilename}
              xlsxFilename={reportReceiptRegister.xlsxFilename}
              clientTableExport={clientTableExport}
              disabled={!validStartDate || !validEndDate}
            />
          </div>

          <ReportRegisterTableScroll>
            <ReportRegisterResultBar count={rows.length} rowLabel="records shown" limit={limit} />
            <table className={cn(rr.table, "min-w-[900px]")}>
              <thead className={rr.thead}>
                <tr>
                  <th className={rr.th}>Date</th>
                  <th className={rr.th}>Receipt no.</th>
                  <th className={rr.th}>Customer</th>
                  <th
                    className={rr.th}
                    title="Allocated invoice number(s); open list when there are several"
                  >
                    Ref. invoices
                  </th>
                  <th className={rr.th}>Mode</th>
                  <th className={rr.thRight}>Amount</th>
                  <th
                    className={rr.thRight}
                    title="Invoice allocations plus opening-balance settlement"
                  >
                    Adjusted
                  </th>
                  <th className={rr.thRight} title="Receipt total minus adjusted">
                    Unadjusted
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <ReportRegisterEmptyRow
                    colSpan={8}
                    message="No receipts found. Try adjusting filters or the date range."
                  />
                ) : (
                  rows.map((r) => {
                    const adjDisplay = totalAppliedAmount(r);
                    const unadjDisplay = remainingUnallocatedDisplay(r);
                    return (
                      <tr key={r.id} className={rr.tr}>
                        <td className={rr.tdMuted}>{formatDate(r.receivedAt)}</td>
                        <td className={rr.td}>
                          <button
                            type="button"
                            onClick={() => setAllocDialogReceiptId(r.id)}
                            className={cn(
                              rr.link,
                              "cursor-pointer border-0 bg-transparent p-0 text-left font-medium",
                            )}
                            title="View allocated invoices"
                          >
                            {r.receiptNumber}
                          </button>
                        </td>
                        <td className={rr.td}>{r.partyName ?? "—"}</td>
                        <td className={cn(rr.td, "max-w-[13rem]")}>
                          <ReceiptRegisterRefInvoicesCell
                            row={r}
                            onOpenDialog={() => setAllocDialogReceiptId(r.id)}
                          />
                        </td>
                        <td className={rr.tdMuted}>
                          {r.paymentMethod
                            ? capitaliseWords(String(r.paymentMethod).replace(/_/g, " "))
                            : "—"}
                        </td>
                        <td className={cn(rr.tdRight, "font-medium")}>
                          {formatCurrency(r.totalAmount)}
                        </td>
                        <td className={rr.tdRightMuted}>
                          {formatCurrency(String(adjDisplay.toFixed(2)))}
                        </td>
                        <td className={rr.tdRight}>
                          {formatCurrency(String(unadjDisplay.toFixed(2)))}
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
                      colSpan={5}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      Total — {rows.length} {rows.length === 1 ? "record" : "records"}
                    </td>
                    <td className={cn(rr.tdRight, "font-bold text-foreground")}>
                      {formatCurrency(String(totals.amount.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {formatCurrency(String(totals.adjusted.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRight, "font-bold text-foreground")}>
                      {formatCurrency(String(totals.unadjusted.toFixed(2)))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </ReportRegisterTableScroll>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 py-14 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">
            Select a date range and click{" "}
            <span className="font-semibold text-foreground">Search</span> to load data.
          </p>
        </div>
      )}

      <Dialog
        open={allocDialogReceiptId != null}
        onOpenChange={(o) => !o && setAllocDialogReceiptId(null)}
      >
        <DialogContent className="max-h-[80vh] w-[min(100%,36rem)] gap-4 p-5 sm:max-w-[36rem]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              {allocDetail?.receiptNumber ?? "Receipt"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Allocated invoices</p>
          </DialogHeader>
          {allocPending ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : invoiceAllocRows.length === 0 && openingSettlementOnDetail <= MONEY_EPS ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No invoice allocations on this receipt.
            </p>
          ) : (
            <div className="rounded-md border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="min-w-[7rem] px-3 py-2.5 text-left text-xs font-bold text-foreground">
                      Receipt no.
                    </th>
                    <th className="min-w-[10rem] px-3 py-2.5 text-left text-xs font-bold text-foreground">
                      Invoice no.
                    </th>
                    <th className="min-w-[8rem] px-3 py-2.5 text-right text-xs font-bold text-foreground">
                      Adjusted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openingSettlementOnDetail > MONEY_EPS ? (
                    <tr className="border-t border-border first:border-t-0">
                      <td className="px-3 py-2.5 tabular-nums text-foreground">
                        {allocDetail?.receiptNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">Opening balance</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(String(openingSettlementOnDetail.toFixed(2)))}
                      </td>
                    </tr>
                  ) : null}
                  {invoiceAllocRows.map((a) => (
                    <tr
                      key={`${a.invoiceId}-${a.id ?? ""}`}
                      className="border-t border-border first:border-t-0"
                    >
                      <td className="px-3 py-2.5 tabular-nums text-foreground">
                        {allocDetail?.receiptNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/invoices/${a.invoiceId}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {a.invoiceNumber ?? `#${a.invoiceId}`}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(a.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {allocDetail ? (
            <div className="flex justify-end border-t border-border/60 pt-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/receipts/${allocDetail.id}`}>Open full receipt</Link>
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
