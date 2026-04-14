"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FileStack, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUpdateCreditNoteAllocations } from "@/hooks/use-credit-notes";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  buildCreditNoteAllocationRows,
  creditNoteAllocationInitKey,
  creditNoteAllocationsUnchanged,
  maxCreditNoteAllocToInvoice,
  mergeCreditNoteAllocationsForSave,
  totalAllocatedFromCreditNoteSavePayload,
  type CreditNoteAllocationRowState,
} from "@/lib/credit-note-allocations";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { CreditNoteDetail } from "@/types/credit-note";

function sanitizeDecimalInput(raw: string): string {
  let v = raw.replace(/[^\d.]/g, "");
  const i = v.indexOf(".");
  if (i === -1) return v;
  v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
  return v;
}

export function CreditNoteAllocationEditor({
  creditNoteId,
  creditNote,
  onSaved,
}: {
  creditNoteId: number;
  creditNote: CreditNoteDetail;
  onSaved?: () => void;
}) {
  const updateAlloc = useUpdateCreditNoteAllocations(creditNoteId);
  const [rows, setRows] = useState<CreditNoteAllocationRowState[]>([]);
  const cnRef = useRef(creditNote);
  cnRef.current = creditNote;

  const initKey = useMemo(() => creditNoteAllocationInitKey(creditNote), [creditNote]);

  useEffect(() => {
    setRows(buildCreditNoteAllocationRows(cnRef.current));
  }, [initKey]);

  const totalCn = parseFloat(creditNote.amount ?? "0") || 0;
  const savePayload = useMemo(
    () => mergeCreditNoteAllocationsForSave(rows, creditNote),
    [rows, creditNote],
  );
  const totalIfSaved = totalAllocatedFromCreditNoteSavePayload(savePayload);
  const remaining = totalCn - totalIfSaved;
  const noAllocationChanges = creditNoteAllocationsUnchanged(rows, creditNote);

  const updateAmount = (invoiceId: number, raw: string) => {
    const amount = sanitizeDecimalInput(raw);
    setRows((prev) => prev.map((r) => (r.invoiceId === invoiceId ? { ...r, amount } : r)));
  };

  const onSuggestAgain = () => {
    setRows(buildCreditNoteAllocationRows(creditNote));
  };

  const initialAllocByInvoiceId = useMemo(() => {
    const m = new Map<number, number>();
    for (const a of creditNote.allocations ?? []) {
      m.set(a.invoiceId, parseFloat(a.amount) || 0);
    }
    return m;
  }, [creditNote.allocations]);

  const rowOverInvoiceCap = (r: CreditNoteAllocationRowState) => {
    const init = initialAllocByInvoiceId.get(r.invoiceId) ?? 0;
    const cap = maxCreditNoteAllocToInvoice(r, init);
    return (parseFloat(r.amount) || 0) > cap + 0.01;
  };

  const anyOverInvoiceCap = rows.some(rowOverInvoiceCap);

  const hasUnpaidInvoices = useMemo(
    () =>
      (creditNote.openInvoicesForParty ?? []).some((i) => parseFloat(i.dueAmount || "0") > 0.001),
    [creditNote.openInvoicesForParty],
  );

  const onSave = async () => {
    if (totalIfSaved > totalCn + 0.001) {
      showErrorToast(
        `Total allocated (${formatCurrency(String(totalIfSaved))}) cannot exceed this credit note (${formatCurrency(creditNote.amount)}).`,
      );
      return;
    }
    const over = rows.find(rowOverInvoiceCap);
    if (over) {
      const init = initialAllocByInvoiceId.get(over.invoiceId) ?? 0;
      const cap = maxCreditNoteAllocToInvoice(over, init);
      showErrorToast(
        `Amount for ${over.invoiceNumber} cannot exceed ${formatCurrency(String(cap))} for this invoice.`,
      );
      return;
    }
    try {
      await updateAlloc.mutateAsync({ allocations: savePayload });
      showSuccessToast("Allocations updated");
      onSaved?.();
    } catch (e) {
      showErrorToast(e, "Failed to update allocations");
    }
  };

  if (!hasUnpaidInvoices) {
    const unallocated = Math.max(0, remaining);
    return (
      <Card
        id="credit-note-allocate"
        className="min-w-0 max-w-full scroll-mt-20 overflow-hidden rounded-2xl border-border/80 shadow-sm"
      >
        <CardHeader className="space-y-3 border-b border-border/60 bg-muted/15 px-4 py-4 sm:px-6">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
              <FileStack className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base font-semibold tracking-tight">
                No open sale invoices for this customer
              </CardTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">
                There are no final sale invoices with a balance due right now. Amounts already
                applied to paid invoices stay on this credit note until you change them here; the
                rest stays unallocated until there are open invoices to allocate against.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 py-4 sm:px-6">
          <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2 sm:gap-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Credit note amount
              </span>
              <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
                {formatCurrency(creditNote.amount)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Unallocated after current allocations
              </span>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold tabular-nums tracking-tight",
                  unallocated > 0.001
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-muted-foreground",
                )}
              >
                {formatCurrency(String(unallocated))}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            When new unpaid sale invoices exist for this customer, open this credit note again — the
            allocation section will list them automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      id="credit-note-allocate"
      className="min-w-0 max-w-full overflow-hidden rounded-2xl border-border/80 shadow-sm"
    >
      <CardHeader className="space-y-1 border-b border-border/60 bg-muted/15 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">
              Allocate to sale invoices
            </CardTitle>
            <p className="max-w-full text-pretty text-sm leading-relaxed text-muted-foreground sm:max-w-2xl">
              Only final sale invoices with an open balance are listed. Amounts already applied to
              fully paid invoices stay on the credit note until you change rows here. Unallocated
              balance is suggested across these invoices (oldest first).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto sm:self-start"
            onClick={onSuggestAgain}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Reset suggestions
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-border/60">
          <div className="flex flex-col justify-center px-4 py-4 sm:px-5 sm:py-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Credit note amount
            </span>
            <p className="mt-1 break-words text-lg font-semibold tabular-nums tracking-tight sm:text-xl">
              {formatCurrency(creditNote.amount)}
            </p>
          </div>
          <div className="flex flex-col justify-center px-4 py-4 sm:px-5 sm:py-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              In this form
            </span>
            <p className="mt-1 break-words text-lg font-semibold tabular-nums tracking-tight text-primary sm:text-xl">
              {formatCurrency(String(totalIfSaved))}
            </p>
          </div>
          <div className="flex flex-col justify-center px-4 py-4 sm:px-5 sm:py-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Left after save
            </span>
            <p
              className={cn(
                "mt-1 break-words text-lg font-semibold tabular-nums tracking-tight sm:text-xl",
                remaining > 0.001 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
              )}
            >
              {formatCurrency(String(Math.max(0, remaining)))}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices to show.</p>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border border-border/80">
            <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Type
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Paid
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Due
                    </th>
                    <th className="w-[8.5rem] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-foreground">
                      Allocate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const alloc = parseFloat(r.amount) || 0;
                    const init = initialAllocByInvoiceId.get(r.invoiceId) ?? 0;
                    const cap = maxCreditNoteAllocToInvoice(r, init);
                    const overCap = alloc > cap + 0.01;
                    return (
                      <tr
                        key={r.invoiceId}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/25"
                      >
                        <td className="px-3 py-2.5 align-middle font-medium">
                          <Link
                            href={`/invoices/${r.invoiceId}`}
                            className="text-primary hover:underline"
                          >
                            {r.invoiceNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle text-muted-foreground">
                          {r.invoiceDate ? formatDate(r.invoiceDate) : "—"}
                        </td>
                        <td className="px-3 py-2.5 align-middle capitalize text-muted-foreground">
                          {(r.invoiceType ?? "—").replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle tabular-nums">
                          {r.totalAmount === "—" ? "—" : formatCurrency(r.totalAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle tabular-nums text-muted-foreground">
                          {r.paidAmount === "—" ? "—" : formatCurrency(r.paidAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle font-medium tabular-nums">
                          {formatCurrency(r.dueAmount)}
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex flex-col items-end gap-0.5">
                            <Input
                              className={cn(
                                "h-9 w-full max-w-[7.25rem] text-right tabular-nums",
                                overCap && "border-destructive focus-visible:ring-destructive/30",
                              )}
                              value={r.amount}
                              onChange={(e) => updateAmount(r.invoiceId, e.target.value)}
                              onPaste={(e) => {
                                e.preventDefault();
                                const el = e.currentTarget;
                                const start = el.selectionStart ?? r.amount.length;
                                const end = el.selectionEnd ?? r.amount.length;
                                const pasted = e.clipboardData.getData("text");
                                const next =
                                  r.amount.slice(0, start) + pasted + r.amount.slice(end);
                                updateAmount(r.invoiceId, next);
                                requestAnimationFrame(() => {
                                  const len = sanitizeDecimalInput(next).length;
                                  el.setSelectionRange(len, len);
                                });
                              }}
                              inputMode="decimal"
                              autoComplete="off"
                              spellCheck={false}
                              aria-label={`Allocate to ${r.invoiceNumber}`}
                            />
                            {overCap && (
                              <span className="max-w-[7.25rem] text-right text-[11px] text-destructive">
                                Max {formatCurrency(String(cap))}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Separator className="bg-border/60" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void onSave()}
              disabled={
                updateAlloc.isPending ||
                totalIfSaved > totalCn + 0.001 ||
                anyOverInvoiceCap ||
                noAllocationChanges
              }
              className="min-w-[140px]"
            >
              {updateAlloc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save allocations
            </Button>
            {noAllocationChanges && !anyOverInvoiceCap && totalIfSaved <= totalCn + 0.001 && (
              <p className="text-sm text-muted-foreground">No changes to save.</p>
            )}
            {totalIfSaved > totalCn + 0.001 && (
              <p className="text-sm text-destructive">
                Total must not exceed the credit note amount.
              </p>
            )}
            {anyOverInvoiceCap && totalIfSaved <= totalCn + 0.001 && (
              <p className="text-sm text-destructive">
                One or more rows exceed what can be applied to that invoice.
              </p>
            )}
          </div>
          <p className="min-w-0 max-w-full text-pretty text-xs leading-relaxed text-muted-foreground sm:max-w-md sm:text-right">
            Saving sends these rows plus any amounts already on invoices not listed (fully paid).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
