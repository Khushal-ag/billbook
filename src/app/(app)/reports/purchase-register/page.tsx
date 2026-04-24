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
import { RegisterInvoicePayStatusBadge } from "@/components/reports/RegisterInvoicePayStatusBadge";
import {
  ReportRegisterEmptyRow,
  ReportRegisterResultBar,
  ReportRegisterSearchCard,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { useInvoiceRegister } from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { DEFAULT_REPORT_LIMIT, MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import { reportPurchaseRegister } from "@/lib/reports/report-labels";
import {
  REGISTER_FLOAT_EPS,
  calcInvoiceRegisterPayStatus,
  invoiceRegisterRowMatches,
  invoiceTypeRegisterLabel,
  sumInvoiceRegisterRows,
  type InvoiceRegisterPayStatusFilter,
} from "@/lib/reports/invoice-register-filters";
import { cn, formatCurrency, formatDate } from "@/lib/core/utils";
import type { InvoiceType } from "@/types/invoice";
import type { Party } from "@/types/party";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";

type DocTypeFilter = "ALL" | "PURCHASE_INVOICE" | "PURCHASE_RETURN";
type PayStatusFilter = InvoiceRegisterPayStatusFilter;

const PURCHASE_TYPES: InvoiceType[] = ["PURCHASE_INVOICE", "PURCHASE_RETURN"];

interface Filters {
  billNo: string;
  supplierParty: Party | null;
  docType: DocTypeFilter;
  payStatus: PayStatusFilter;
}

const EMPTY_FILTERS: Filters = {
  billNo: "",
  supplierParty: null,
  docType: "ALL",
  payStatus: "ALL",
};

export default function PurchaseRegisterPage() {
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
  const [limit] = useState(DEFAULT_REPORT_LIMIT);

  const { data, isPending, error } = useInvoiceRegister(
    validStartDate,
    validEndDate,
    limit,
    undefined,
  );

  const rows = useMemo(() => {
    const bill = applied.billNo.trim();
    return (data?.invoices ?? []).filter((inv) =>
      invoiceRegisterRowMatches(inv, {
        allowedTypes: PURCHASE_TYPES,
        docType: applied.docType,
        billNoTrimmed: bill,
        party: applied.supplierParty,
        payStatus: applied.payStatus,
      }),
    );
  }, [data, applied]);

  const totals = useMemo(() => sumInvoiceRegisterRows(rows), [rows]);

  const handleSearch = () => setApplied({ ...draft });
  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };
  const isFiltered =
    !!applied.billNo.trim() ||
    applied.supplierParty != null ||
    applied.docType !== "ALL" ||
    applied.payStatus !== "ALL";

  const exportQuery = useMemo(
    () => ({
      startDate: validStartDate,
      endDate: validEndDate,
      limit,
      ...(applied.docType !== "ALL" ? { invoiceType: applied.docType } : {}),
    }),
    [validStartDate, validEndDate, limit, applied.docType],
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportPurchaseRegister.title}
        description={reportPurchaseRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportPurchaseRegister.loadError} />

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

        {/* Filter rows — 2-column on sm+ */}
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Bill / Invoice no.</Label>
            <Input
              className="h-8"
              value={draft.billNo}
              onChange={(e) => setDraft((d) => ({ ...d, billNo: e.target.value }))}
              placeholder="e.g. BILL-0012"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <Select
              value={draft.docType}
              onValueChange={(v) => setDraft((d) => ({ ...d, docType: v as DocTypeFilter }))}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PURCHASE_INVOICE">Purchase invoice</SelectItem>
                <SelectItem value="PURCHASE_RETURN">Purchase return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Supplier</Label>
            <PartyAutocomplete
              value={draft.supplierParty}
              onValueChange={(p) => setDraft((d) => ({ ...d, supplierParty: p }))}
              serverSearch
              partiesQueryType="SUPPLIER"
              placeholder="Type to search suppliers…"
              className="h-8"
              inputId="purchase-register-supplier"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Payment status</Label>
            <Select
              value={draft.payStatus}
              onValueChange={(v) => setDraft((d) => ({ ...d, payStatus: v as PayStatusFilter }))}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partial paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={
              !isFiltered &&
              !draft.billNo &&
              !draft.supplierParty &&
              draft.docType === "ALL" &&
              draft.payStatus === "ALL"
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

      {/* ── Results ── */}
      {isPending ? (
        <ReportTabSkeleton layout="register-with-toolbar" />
      ) : data ? (
        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{rows.length}</span>
              {rows.length === 1 ? "record" : "records"}
              {isFiltered && (
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
            <ReportRegisterExportToolbar
              reportPath="/reports/invoice-register"
              query={exportQuery}
              csvFilename={reportPurchaseRegister.csvFilename}
              pdfFilename={reportPurchaseRegister.pdfFilename}
              xlsxFilename={reportPurchaseRegister.xlsxFilename}
              disabled={!validStartDate || !validEndDate}
            />
          </div>

          <ReportRegisterTableScroll>
            <ReportRegisterResultBar count={rows.length} rowLabel="records shown" limit={limit} />
            <table className={cn(rr.table, "min-w-[820px]")}>
              <thead className={rr.thead}>
                <tr>
                  <th className={rr.th}>Date</th>
                  <th className={rr.th}>Invoice no.</th>
                  <th className={rr.th}>Type</th>
                  <th className={rr.th}>Supplier</th>
                  <th className={rr.thRight}>Total</th>
                  <th className={rr.thRight}>Paid</th>
                  <th className={rr.thRight}>Balance</th>
                  <th className={rr.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <ReportRegisterEmptyRow
                    colSpan={8}
                    message="No purchase documents found. Try adjusting your filters or date range."
                  />
                ) : (
                  rows.map((inv) => {
                    const ps = calcInvoiceRegisterPayStatus(
                      inv.totalAmount,
                      inv.paidAmount ?? undefined,
                      inv.dueAmount,
                    );
                    const balance = parseFloat(inv.dueAmount ?? "0");
                    return (
                      <tr key={inv.id} className={rr.tr}>
                        <td className={rr.tdMuted}>{formatDate(inv.invoiceDate)}</td>
                        <td className={rr.td}>
                          <Link href={`/invoices/${inv.id}`} className={rr.link}>
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className={rr.tdMuted}>{invoiceTypeRegisterLabel(inv.invoiceType)}</td>
                        <td className={rr.td}>{inv.partyName ?? "—"}</td>
                        <td className={cn(rr.tdRight, "font-medium")}>
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className={rr.tdRightMuted}>{formatCurrency(inv.paidAmount ?? "0")}</td>
                        <td
                          className={cn(
                            rr.tdRight,
                            "font-medium",
                            balance > REGISTER_FLOAT_EPS
                              ? "text-rose-700 dark:text-rose-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatCurrency(inv.dueAmount ?? "0")}
                        </td>
                        <td className={rr.td}>
                          <RegisterInvoicePayStatusBadge status={ps} />
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
                      Total — {rows.length} {rows.length === 1 ? "record" : "records"}
                    </td>
                    <td className={cn(rr.tdRight, "font-bold text-foreground")}>
                      {formatCurrency(String(totals.total.toFixed(2)))}
                    </td>
                    <td className={cn(rr.tdRightMuted, "font-semibold")}>
                      {formatCurrency(String(totals.paid.toFixed(2)))}
                    </td>
                    <td
                      className={cn(
                        rr.tdRight,
                        "font-bold",
                        totals.balance > REGISTER_FLOAT_EPS
                          ? "text-rose-700 dark:text-rose-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatCurrency(String(totals.balance.toFixed(2)))}
                    </td>
                    <td />
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
    </div>
  );
}
