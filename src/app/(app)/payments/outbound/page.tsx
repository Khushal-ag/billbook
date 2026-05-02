"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ArrowDownLeft, BarChart3, FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import EmptyState from "@/components/EmptyState";
import { OutboundPaymentsTable } from "@/components/outbound-payments/OutboundPaymentsTable";
import { useOutboundPayments } from "@/hooks/use-outbound-payments";
import { useParties } from "@/hooks/use-parties";
import { OUTBOUND_CATEGORY_OPTIONS } from "@/constants/outbound-payment";
import type { OutboundPayment, OutboundPaymentCategory } from "@/types/outbound-payment";
import { formatCurrency } from "@/lib/core/utils";

function sumOutboundAmounts(rows: OutboundPayment[]): number {
  return rows.reduce((acc, p) => {
    const n = parseFloat(String(p.amount ?? "0").replace(/,/g, ""));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export default function OutboundPaymentsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [category, setCategory] = useState<OutboundPaymentCategory | "ALL">("ALL");
  const [partyIdStr, setPartyIdStr] = useState<string>("all");

  const partyId = partyIdStr === "all" ? undefined : parseInt(partyIdStr, 10);

  const { data, isPending, error } = useOutboundPayments({
    page,
    pageSize,
    category,
    partyId: Number.isFinite(partyId) ? partyId : undefined,
  });

  const { data: partiesData } = useParties({ includeInactive: true, limit: 200 });
  const parties = useMemo(
    () => (partiesData?.parties ?? []).filter((p) => p.isActive),
    [partiesData?.parties],
  );
  const partyNamesById = useMemo(() => {
    const m = new Map<number, string>();
    for (const party of partiesData?.parties ?? []) {
      m.set(party.id, party.name);
    }
    return m;
  }, [partiesData?.parties]);

  const payments = data?.payments ?? [];
  const total = data?.count ?? payments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  const filtersActive = category !== "ALL" || partyIdStr !== "all";
  const pageTotalOutflow = sumOutboundAmounts(payments);

  const clearFilters = () => {
    setCategory("ALL");
    setPartyIdStr("all");
    setPage(1);
  };

  return (
    <div className="page-container max-w-[96rem] animate-fade-in">
      <PageHeader
        title="Payments"
        description="Outgoing payments — refunds, supplier settlements, and expenses. Each row is a voucher you can open as PDF."
        action={
          <Button asChild className="shadow-sm">
            <Link href="/payments/outbound/new">
              <Plus className="mr-2 h-4 w-4" />
              Record payment
            </Link>
          </Button>
        }
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load payments" />

      {!isPending && payments.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              Matching payments
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {total.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtersActive ? "With current filters" : "All vouchers"}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
              This page total
            </div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-rose-700 dark:text-rose-400">
              {formatCurrency(pageTotalOutflow.toFixed(2))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {payments.length} row{payments.length === 1 ? "" : "s"} on page {page}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Visible range</div>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {rangeStart}–{rangeEnd}
              <span className="text-sm font-normal text-muted-foreground"> of {total}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Row numbers in the table below</p>
          </div>
        </div>
      )}

      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-semibold text-foreground">Filters</span>
            {filtersActive ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Active
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filtersActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : null}
            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs" asChild>
              <Link href="/reports/payout-register" title="Payment register (reports)">
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Payment register</span>
                <span className="sm:hidden">Register</span>
              </Link>
            </Button>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="w-full min-w-[200px] max-w-md flex-1 space-y-2">
              <Label htmlFor="payment-type-filter" className="text-xs text-muted-foreground">
                Payment type
              </Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v as OutboundPaymentCategory | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger id="payment-type-filter" className="h-11 bg-background">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {OUTBOUND_CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full min-w-[220px] max-w-md flex-1 space-y-2">
              <Label htmlFor="payment-party-filter" className="text-xs text-muted-foreground">
                Party
              </Label>
              <Select
                value={partyIdStr}
                onValueChange={(v) => {
                  setPartyIdStr(v);
                  setPage(1);
                }}
              >
                <SelectTrigger id="payment-party-filter" className="h-11 bg-background">
                  <SelectValue placeholder="All parties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All parties</SelectItem>
                  {parties.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isPending ? (
        <TableSkeleton rows={8} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<ArrowDownLeft className="h-8 w-8" />}
          title="No payments yet"
          description="Record a customer refund on a sale return, pay a supplier, or log an expense — each one appears here with a PDF voucher."
          action={
            <Button asChild>
              <Link href="/payments/outbound/new">Record payment</Link>
            </Button>
          }
        />
      ) : (
        <OutboundPaymentsTable
          payments={payments}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPageChange={setPage}
          partyNamesById={partyNamesById}
        />
      )}
    </div>
  );
}
