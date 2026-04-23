"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Calendar, FileMinus, FileText, List, Trash2, User } from "lucide-react";
import { LinkedInvoiceLink } from "@/components/invoices/LinkedInvoiceLink";
import PageHeader from "@/components/PageHeader";
import { PageBackLink } from "@/components/PageBackLink";
import ErrorBanner from "@/components/ErrorBanner";
import CreditNoteDetailSkeleton from "@/components/skeletons/CreditNoteDetailSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditNoteAllocationEditor } from "@/components/credit-notes/CreditNoteSections";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import { useCreditNote, useDeleteCreditNote } from "@/hooks/use-credit-notes";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { ApiClientError } from "@/api/error";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/business/trial";
import {
  creditNoteSourceInvoiceLinkProps,
  resolvedCreditNotePartyId,
} from "@/lib/credit-notes/credit-note-display";
import { cn, formatCurrency, formatDate } from "@/lib/core/utils";

function isFullyUnallocated(allocated: string | undefined): boolean {
  return (parseFloat(allocated ?? "0") || 0) <= 0.001;
}

export default function CreditNoteDetailPage() {
  const params = useParams<{ creditNoteId?: string | string[] }>();
  const router = useRouter();
  const idParam = Array.isArray(params?.creditNoteId)
    ? params.creditNoteId[0]
    : params?.creditNoteId;
  const creditNoteId = idParam ? parseInt(idParam, 10) : NaN;

  const { can } = usePermissions();
  const deleteMutation = useDeleteCreditNote();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const {
    data: creditNote,
    isPending,
    error,
    refetch,
  } = useCreditNote(Number.isFinite(creditNoteId) ? creditNoteId : undefined);

  useEffect(() => {
    if (typeof window === "undefined" || !Number.isFinite(creditNoteId)) return;
    if (isPending || !creditNote) return;
    if (window.location.hash !== "#credit-note-allocate") return;
    const t = window.setTimeout(() => {
      document
        .getElementById("credit-note-allocate")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [isPending, creditNote, creditNoteId]);

  const confirmDelete = async () => {
    if (!Number.isFinite(creditNoteId)) return;
    try {
      await deleteMutation.mutateAsync(creditNoteId);
      showSuccessToast("Credit note deleted");
      setDeleteConfirmOpen(false);
      router.push("/credit-notes");
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      if (err instanceof ApiClientError && err.status === 409) {
        showErrorToast(
          "This credit note is still applied to invoices. Clear allocations first (save with nothing allocated), then try again.",
          "Can’t delete while allocated",
        );
      } else {
        showErrorToast(err, "Failed to delete");
      }
      setDeleteConfirmOpen(false);
    }
  };

  if (!Number.isFinite(creditNoteId)) {
    return (
      <div className="page-container min-w-0">
        <ErrorBanner
          error={new Error("Invalid credit note")}
          fallbackMessage="Invalid credit note ID."
        />
      </div>
    );
  }

  if (isPending) return <CreditNoteDetailSkeleton />;

  if (!creditNote) {
    return (
      <div className="page-container w-full min-w-0 max-w-5xl">
        <PageBackLink href="/credit-notes">Back to credit notes</PageBackLink>
        <PageHeader title="Credit note" description="" />
        <ErrorBanner error={error} fallbackMessage="Credit note not found." />
      </div>
    );
  }

  const totalCn = parseFloat(creditNote.amount ?? "0") || 0;
  const allocatedSum = parseFloat(creditNote.allocatedAmount ?? "0") || 0;
  const remaining = Math.max(0, totalCn - allocatedSum);
  const allocPct = totalCn > 0 ? Math.min(100, Math.round((allocatedSum / totalCn) * 100)) : 0;

  const appliedAllocations = (creditNote.allocations ?? []).filter(
    (a) => (parseFloat(a.amount) || 0) > 0.001,
  );

  const partyLedgerId = resolvedCreditNotePartyId(creditNote);
  const partyNameForLink = creditNote.party?.partyName?.trim() ?? "";
  const partyLabel = partyNameForLink || "—";
  const canLinkPartyLedger = partyLedgerId != null && partyNameForLink !== "";

  const canDelete =
    can(P.credit_note.delete) &&
    creditNote.deletedAt == null &&
    isFullyUnallocated(creditNote.allocatedAmount);

  return (
    <div className="page-container w-full min-w-0 max-w-5xl animate-fade-in space-y-6 pb-8 sm:space-y-8 sm:pb-10">
      <PageBackLink href="/credit-notes">Back to credit notes</PageBackLink>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="grid min-w-0 lg:grid-cols-[1fr_minmax(260px,340px)] lg:items-stretch">
          <div className="flex min-w-0 flex-col gap-5 border-b border-border/60 p-4 sm:gap-6 sm:p-8 lg:border-b-0 lg:border-r lg:border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                Credit note
              </Badge>
              <StatusBadge status={creditNote.status} />
              {remaining > 0.001 && (
                <Badge
                  variant="outline"
                  className="max-w-full whitespace-normal break-words border-amber-500/40 bg-amber-500/5 text-left font-normal text-amber-800 dark:text-amber-200"
                >
                  {formatCurrency(String(remaining))} unallocated
                </Badge>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                {creditNote.creditNoteNumber}
              </h1>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                    <span className="min-w-0">
                      Created{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(creditNote.createdAt)}
                      </span>
                    </span>
                    <span className="hidden text-muted-foreground/80 sm:inline" aria-hidden>
                      ·
                    </span>
                    <span className="min-w-0">
                      Updated{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(creditNote.updatedAt)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 break-words text-sm leading-relaxed">
                    <span className="text-muted-foreground">Customer </span>
                    {canLinkPartyLedger ? (
                      <Link
                        href={`/parties/${partyLedgerId}/ledger`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {partyNameForLink}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">{partyLabel}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 break-words text-sm">
                    <span className="text-muted-foreground">Issued against </span>
                    <LinkedInvoiceLink
                      {...creditNoteSourceInvoiceLinkProps(creditNote)}
                      className="font-medium"
                    />
                  </span>
                </div>
              </div>
            </div>

            {creditNote.reason?.trim() && (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm">
                <span className="font-medium text-foreground">Reason</span>
                <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">
                  {creditNote.reason}
                </p>
              </div>
            )}

            {creditNote.affectsInventory === true && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Note:</span> This credit note includes
                inventory flags from an older record format. Credit notes created from this flow do
                not change stock.
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-6 bg-muted/25 p-4 sm:gap-8 sm:p-8">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Credit note amount
              </p>
              <p className="mt-1 break-words text-2xl font-bold tabular-nums tracking-tight sm:text-3xl md:text-4xl">
                {formatCurrency(creditNote.amount)}
              </p>

              <div className="mt-5 space-y-3 sm:mt-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <FileMinus className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">Allocated to invoices</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(String(allocatedSum))}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={allocPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Share of credit note allocated"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${allocPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">Still unallocated</span>
                  <span
                    className={cn(
                      "shrink-0 font-medium tabular-nums",
                      remaining > 0.001
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatCurrency(String(remaining))}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-border/60 lg:hidden" />

            <Button variant="outline" className="w-full min-w-0 sm:w-auto" asChild>
              <Link
                href="/credit-notes"
                className="inline-flex min-w-0 items-center justify-center"
              >
                <List className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">All credit notes</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <ErrorBanner error={error} />

      {appliedAllocations.length > 0 && (
        <Card className="min-w-0 overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/15 px-4 py-4 sm:px-8">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Applied to invoices
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Where this credit note has been allocated.
            </p>
          </CardHeader>
          <CardContent className="min-w-0 px-4 py-4 sm:px-8 sm:py-6">
            <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appliedAllocations.map((a) => (
                    <tr
                      key={`${a.invoiceId}-${a.amount}`}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium">
                        <LinkedInvoiceLink
                          invoiceId={a.invoiceId}
                          invoiceNumber={a.invoiceNumber}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(a.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreditNoteAllocationEditor
        creditNoteId={creditNoteId}
        creditNote={creditNote}
        onSaved={() => void refetch()}
      />

      {can(P.credit_note.delete) && (
        <div className="min-w-0 rounded-xl border border-border/60 bg-muted/10 p-4 sm:p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Deleting removes this credit from the customer’s account and archives the note. You can
            only delete when it isn’t applied to invoices — clear allocations first if needed.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="mt-3"
            disabled={!canDelete || deleteMutation.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete credit note
          </Button>
          {!canDelete && creditNote.deletedAt == null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Save with no amounts allocated to invoices before you can delete.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => void confirmDelete()}
        title="Delete credit note"
        description="This removes the customer credit and archives the credit note. You can only delete when it isn’t applied to any sale invoices."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
