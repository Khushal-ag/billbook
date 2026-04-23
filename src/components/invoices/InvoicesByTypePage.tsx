"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { InvoiceFilters, InvoicesTable } from "@/components/invoices/InvoiceSections";
import { useInvoices } from "@/hooks/use-invoices";
import { useInvoicesListFilters } from "@/hooks/invoices";
import { useParties } from "@/hooks/use-parties";
import { useCanCreateInvoice } from "@/hooks/use-can-create-invoice";
import { BusinessProfileGateAlert } from "@/components/business/BusinessProfileGateAlert";
import {
  getInvoiceBalanceDue,
  getInvoiceListStatsLabels,
  isSalesFamily,
} from "@/lib/invoice/invoice";
import { formatCurrency } from "@/lib/core/utils";
import type { InvoiceType } from "@/types/invoice";

interface InvoicesByTypePageProps {
  invoiceType: InvoiceType;
  title: string;
  description: string;
  createLabel: string;
}

export function InvoicesByTypePage({
  invoiceType,
  title,
  description,
  createLabel,
}: InvoicesByTypePageProps) {
  const {
    page,
    pageSize,
    setPage,
    statusFilter,
    search,
    debouncedSearch,
    setSearch,
    partyId,
    startDate,
    endDate,
    handleStatusChange,
    handlePartyChange,
    handleStartDateChange,
    handleEndDateChange,
  } = useInvoicesListFilters();

  const partyType = isSalesFamily(invoiceType) ? "CUSTOMER" : "SUPPLIER";
  const { data: partiesData } = useParties({ type: partyType, includeInactive: false });
  const { canCreateInvoice, businessProfile } = useCanCreateInvoice();
  const parties = (partiesData?.parties ?? []).filter((p) => p.isActive);
  const allowCreate = canCreateInvoice === true;

  const { data, isPending, error } = useInvoices({
    page,
    pageSize,
    status: statusFilter,
    search: debouncedSearch || undefined,
    invoiceType,
    partyId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const invoices = useMemo(() => {
    const raw = data?.invoices ?? [];
    return raw.filter((inv) => inv.invoiceType === invoiceType);
  }, [data?.invoices, invoiceType]);

  const totalPages = Math.ceil((data?.count ?? 0) / pageSize) || 1;
  const total = data?.count ?? 0;

  const statLabels = useMemo(() => getInvoiceListStatsLabels(invoiceType), [invoiceType]);

  const stats = useMemo(() => {
    const totalValue = invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.totalAmount ?? "0") || 0),
      0,
    );
    const collected = invoices.reduce(
      (sum, inv) => sum + (parseFloat(inv.paidAmount ?? "0") || 0),
      0,
    );
    const outstanding = invoices.reduce(
      (sum, inv) => sum + (inv.status === "CANCELLED" ? 0 : getInvoiceBalanceDue(inv)),
      0,
    );
    const overdueCount = invoices.filter(
      (inv) => inv.isOverdue && inv.status !== "CANCELLED",
    ).length;
    return { totalValue, collected, outstanding, overdueCount };
  }, [invoices]);

  return (
    <div className="page-container max-w-[96rem] animate-fade-in">
      <PageHeader
        title={title}
        description={description}
        action={
          allowCreate ? (
            <Button asChild>
              <Link href={`/invoices/new?type=${invoiceType}`}>
                <Plus className="mr-2 h-4 w-4" />
                {createLabel}
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled aria-disabled>
              <Plus className="mr-2 h-4 w-4" />
              {createLabel}
            </Button>
          )
        }
      />
      {canCreateInvoice === false ? (
        <div className="mb-4">
          <BusinessProfileGateAlert businessProfile={businessProfile} />
        </div>
      ) : null}

      <Tabs value={statusFilter} onValueChange={handleStatusChange} className="mb-4">
        <TabsList className="h-9">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="FINAL">Finalised</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {!isPending && invoices.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{statLabels.countHeading}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{statLabels.valueHeading}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {formatCurrency(stats.totalValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{statLabels.paidHeading}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
                {formatCurrency(stats.collected)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{statLabels.balanceHeading}</p>
              <p
                className={`mt-1 text-xl font-semibold tabular-nums ${
                  stats.overdueCount > 0 ? "text-destructive" : ""
                }`}
              >
                {formatCurrency(stats.outstanding)}
              </p>
              {stats.overdueCount > 0 && (
                <p className="mt-0.5 text-xs text-destructive">
                  {stats.overdueCount} {statLabels.balanceAttentionWord}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <InvoiceFilters
        search={search}
        onSearchChange={setSearch}
        parties={parties}
        partyId={partyId}
        onPartyChange={handlePartyChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load invoices" />

      {isPending ? (
        <TableSkeleton rows={5} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={`No ${title.toLowerCase()} found`}
          description={
            debouncedSearch
              ? `No invoices match "${debouncedSearch}". Try a different search or clear filters.`
              : `Create your first ${title.toLowerCase()} to get started.`
          }
          action={
            !debouncedSearch && allowCreate ? (
              <Button size="sm" asChild>
                <Link href={`/invoices/new?type=${invoiceType}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createLabel}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {debouncedSearch && (
            <p className="mb-2 text-xs text-muted-foreground">
              {invoices.length} result{invoices.length !== 1 ? "s" : ""} for &ldquo;
              {debouncedSearch}&rdquo;
            </p>
          )}

          <InvoicesTable invoices={invoices} invoiceType={invoiceType} />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
