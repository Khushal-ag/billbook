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

  const { data: partiesData } = useParties({ includeInactive: false, limit: 200 });
  const parties = useMemo(
    () => (partiesData?.parties ?? []).filter((p) => p.isActive),
    [partiesData?.parties],
  );

  const payments = data?.payments ?? [];
  const total = data?.count ?? payments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page-container max-w-[96rem] animate-fade-in">
      <PageHeader
        title="Outbound payments"
        description="Refunds, supplier payments, and expenses — money paid out."
        action={
          <Button asChild>
            <Link href="/payments/outbound/new">
              <Plus className="mr-2 h-4 w-4" />
              New payment
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-full min-w-[160px] max-w-xs space-y-2">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as OutboundPaymentCategory | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
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
        <div className="w-full min-w-[200px] max-w-xs space-y-2">
          <Label className="text-xs text-muted-foreground">Party (optional)</Label>
          <Select
            value={partyIdStr}
            onValueChange={(v) => {
              setPartyIdStr(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
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

      <ErrorBanner error={error} fallbackMessage="Failed to load outbound payments" />

      {isPending ? (
        <TableSkeleton rows={8} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<ArrowDownLeft className="h-8 w-8" />}
          title="No outbound payments"
          description="Record sale return refunds, party payments, or expenses."
          action={
            <Button asChild>
              <Link href="/payments/outbound/new">New payment</Link>
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
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
