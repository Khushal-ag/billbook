"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AlertTriangle, ArrowLeft, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import TablePagination from "@/components/TablePagination";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { useInvoices, useInvoicesListFilters } from "@/hooks/invoices";
import { useParties } from "@/hooks/use-parties";
import { useBusinessProfile } from "@/hooks/use-business";
import { INVOICE_TYPE_OPTIONS } from "@/lib/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceType } from "@/types/invoice";

export type ReturnDocumentType = Extract<InvoiceType, "SALE_RETURN" | "PURCHASE_RETURN">;

interface ReturnSourceInvoicePickerProps {
  returnType: ReturnDocumentType;
}

export function ReturnSourceInvoicePicker({ returnType }: ReturnSourceInvoicePickerProps) {
  const router = useRouter();
  const sourceInvoiceType: InvoiceType =
    returnType === "SALE_RETURN" ? "SALE_INVOICE" : "PURCHASE_INVOICE";
  const partyQueryType = returnType === "SALE_RETURN" ? "CUSTOMER" : "SUPPLIER";
  const meta = INVOICE_TYPE_OPTIONS.find((o) => o.type === returnType) ?? INVOICE_TYPE_OPTIONS[0];
  const sourceLabel = sourceInvoiceType === "SALE_INVOICE" ? "sale invoice" : "purchase invoice";
  const searchPlaceholder =
    sourceInvoiceType === "SALE_INVOICE"
      ? "Search by invoice no., party, GSTIN…"
      : "Search by invoice no., vendor, vendor bill…";

  const {
    page,
    pageSize,
    setPage,
    search,
    debouncedSearch,
    setSearch,
    partyId,
    startDate,
    endDate,
    handlePartyChange,
    handleStartDateChange,
    handleEndDateChange,
  } = useInvoicesListFilters({ defaultStatus: "FINAL", defaultPageSize: 20 });

  const { data: partiesData } = useParties({ type: partyQueryType, includeInactive: false });
  const { data: businessProfile } = useBusinessProfile();
  const parties = (partiesData?.parties ?? []).filter((p) => p.isActive);
  const profileCompletion = businessProfile?.profileCompletion;
  const canCreateInvoice = profileCompletion?.canCreateInvoice ?? true;

  const { data, isPending, error } = useInvoices({
    page,
    pageSize,
    status: "FINAL",
    search: debouncedSearch || undefined,
    invoiceType: sourceInvoiceType,
    partyId,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const invoices = useMemo(() => {
    const raw = data?.invoices ?? [];
    return raw.filter((inv) => inv.invoiceType === sourceInvoiceType && inv.status === "FINAL");
  }, [data?.invoices, sourceInvoiceType]);

  const totalPages = Math.ceil((data?.count ?? 0) / pageSize) || 1;
  const total = data?.count ?? 0;

  return (
    <div className="page-container max-w-[96rem] animate-fade-in">
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground" asChild>
          <Link href={meta.path}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to {meta.label}
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`New ${meta.shortLabel}`}
        description={`Choose a finalised ${sourceLabel} to record a return. Only finalised bills can be returned against.`}
      />

      {!canCreateInvoice && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Complete your profile to create invoices</AlertTitle>
          <AlertDescription className="text-xs">
            Business address is required. Add street, city, state and pincode in{" "}
            <Link href="/profile" className="font-medium underline underline-offset-2">
              profile settings
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <InvoiceFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
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
          title={`No finalised ${sourceLabel}s found`}
          description={
            debouncedSearch || partyId != null || (startDate && endDate)
              ? "Try different search or filters, or clear the date range."
              : `Create and finalise a ${sourceLabel} first, then you can record a return here.`
          }
        />
      ) : (
        <>
          {debouncedSearch ? (
            <p className="mb-2 text-xs text-muted-foreground">
              {invoices.length} result{invoices.length !== 1 ? "s" : ""} for &ldquo;
              {debouncedSearch}&rdquo;
            </p>
          ) : null}

          <ReturnSourceTable
            invoices={invoices}
            showVendorBill={sourceInvoiceType === "PURCHASE_INVOICE"}
            canSelect={canCreateInvoice}
            onSelect={(id) => router.push(`/invoices/new?type=${returnType}&sourceInvoiceId=${id}`)}
          />

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

interface ReturnSourceTableProps {
  invoices: Invoice[];
  showVendorBill: boolean;
  canSelect: boolean;
  onSelect: (invoiceId: number) => void;
}

function ReturnSourceTable({
  invoices,
  showVendorBill,
  canSelect,
  onSelect,
}: ReturnSourceTableProps) {
  return (
    <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[300px] text-sm" role="table" aria-label="Finalised invoices">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Invoice #
            </th>
            <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
              Party
            </th>
            {showVendorBill ? (
              <th
                scope="col"
                className="hidden px-3 py-3 text-left font-medium text-muted-foreground lg:table-cell"
              >
                Vendor bill
              </th>
            ) : null}
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground sm:table-cell"
            >
              Date
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Amount
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b transition-colors last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium sm:px-6">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{inv.partyName ?? "—"}</td>
              {showVendorBill ? (
                <td className="hidden px-3 py-3 text-xs text-muted-foreground lg:table-cell">
                  {inv.originalBillNumber?.trim() || "—"}
                </td>
              ) : null}
              <td className="hidden px-3 py-3 tabular-nums text-muted-foreground sm:table-cell">
                {formatDate(inv.invoiceDate)}
              </td>
              <td className="px-3 py-3 text-right font-medium tabular-nums">
                {formatCurrency(inv.totalAmount)}
              </td>
              <td className="px-3 py-3 text-right">
                <Button
                  type="button"
                  size="sm"
                  disabled={!canSelect}
                  onClick={() => onSelect(inv.id)}
                >
                  Return
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
