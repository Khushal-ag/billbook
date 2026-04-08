"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, ArrowDownLeft } from "lucide-react";
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
import { ReportRegisterFilterCard } from "@/components/reports/report-register-ui";
import { useOutboundPayments } from "@/hooks/use-outbound-payments";
import { useParties } from "@/hooks/use-parties";
import { OUTBOUND_CATEGORY_OPTIONS } from "@/constants/outbound-payment";
import type { OutboundPaymentCategory } from "@/types/outbound-payment";

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

  return (
    <div className="page-container max-w-[96rem] animate-fade-in">
      <PageHeader
        title="Payouts"
        description="Refunds, supplier payments, and expenses — each row is a voucher with PDF."
        action={
          <Button asChild>
            <Link href="/payments/outbound/new">
              <Plus className="mr-2 h-4 w-4" />
              Record payout
            </Link>
          </Button>
        }
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load payouts" />

      <ReportRegisterFilterCard className="mb-6">
        <p className="mb-4 text-sm font-medium text-foreground">Filters</p>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full min-w-[200px] max-w-xs space-y-2">
            <Label htmlFor="payout-type-filter" className="text-xs text-muted-foreground">
              Payout type
            </Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as OutboundPaymentCategory | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger id="payout-type-filter" className="h-10 bg-background">
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
          <div className="w-full min-w-[220px] max-w-sm space-y-2">
            <Label htmlFor="payout-party-filter" className="text-xs text-muted-foreground">
              Party
            </Label>
            <Select
              value={partyIdStr}
              onValueChange={(v) => {
                setPartyIdStr(v);
                setPage(1);
              }}
            >
              <SelectTrigger id="payout-party-filter" className="h-10 bg-background">
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
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <Button variant="outline" size="sm" className="h-10" asChild>
              <Link href="/reports/payout-register">Payout register (reports)</Link>
            </Button>
          </div>
        </div>
      </ReportRegisterFilterCard>

      {isPending ? (
        <TableSkeleton rows={8} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<ArrowDownLeft className="h-8 w-8" />}
          title="No payouts yet"
          description="Record a customer refund on a sale return, pay a supplier or party, or log an expense."
          action={
            <Button asChild>
              <Link href="/payments/outbound/new">Record payout</Link>
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
