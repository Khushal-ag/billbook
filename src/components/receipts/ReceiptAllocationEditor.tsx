"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eraser, FileStack, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useParty } from "@/hooks/use-parties";
import { useUpdateReceiptAllocations } from "@/hooks/use-receipts";
import { cn, formatCurrency, formatDate } from "@/lib/core/utils";
import {
  buildReceiptAllocationState,
  deriveOpeningLedgerAmounts,
  EMPTY_OPENING_LEDGER,
  maxReceiptAllocToInvoice,
  maxReceiptAllocToOpening,
  mergeAllocationsForSave,
  receiptAllocationInitKey,
  receiptAllocationsUnchanged,
  receiptOpeningUnchanged,
  shouldShowOpeningBalanceRow,
  totalAllocatedFromSavePayload,
  totalTaggedFromSavePayload,
  type ReceiptAllocationRowState,
} from "@/lib/receipts/receipt-allocations";
import { formatMoneyTwoDp } from "@/lib/receipts/receipt-amounts";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import type { PutReceiptAllocationsRequest, ReceiptDetail } from "@/types/receipt";
import { ApiClientError } from "@/api/error";
import { augmentApiClientErrorForReceipt } from "@/lib/receipts/receipt-errors";

/** Digits and at most one decimal point (for currency amounts). */
function sanitizeDecimalInput(raw: string): string {
  let v = raw.replace(/[^\d.]/g, "");
  const i = v.indexOf(".");
  if (i === -1) return v;
  v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
  return v;
}

function openingDraftToNum(draft: string): number {
  const t = draft.trim();
  if (t === "") return 0;
  const x = parseFloat(sanitizeDecimalInput(t));
  return Number.isFinite(x) ? Math.max(0, x) : 0;
}

/** Fixed width so opening + invoice rows align; matches h-9 w-9 Button + gap-1.5 */
const ALLOC_INPUT_CLASS = "h-9 w-[7.25rem] shrink-0 text-right tabular-nums";
const ALLOC_ACTION_SLOT = "flex h-9 w-9 shrink-0 items-center justify-center";

const isOpeningAdvanceReceipt = (r: ReceiptDetail) => r.paymentMethod === "OPENING_BALANCE";

export function ReceiptAllocationEditor({
  receiptId,
  receipt,
  onSaved,
}: {
  receiptId: number;
  receipt: ReceiptDetail;
  onSaved?: () => void;
}) {
  const updateAlloc = useUpdateReceiptAllocations(receiptId);
  const [rows, setRows] = useState<ReceiptAllocationRowState[]>([]);
  const [openingDraft, setOpeningDraft] = useState("");
  const receiptRef = useRef(receipt);
  receiptRef.current = receipt;

  const openingDisabled = isOpeningAdvanceReceipt(receipt);

  const partyQuery = useParty(receipt.partyId, {
    enabled: receipt.partyId != null && !openingDisabled,
  });
  const party = partyQuery.data;
  const partyLoading = receipt.partyId != null && !openingDisabled && partyQuery.isPending;
  const partyOpeningRaw = party?.openingBalance ?? null;

  const openingLedger = useMemo(
    () =>
      openingDisabled ? EMPTY_OPENING_LEDGER : deriveOpeningLedgerAmounts(receipt, partyOpeningRaw),
    [openingDisabled, receipt, partyOpeningRaw],
  );

  const showOpeningRow = shouldShowOpeningBalanceRow(receipt, openingLedger);

  const initKey = useMemo(
    () => receiptAllocationInitKey(receipt, partyOpeningRaw),
    [receipt, partyOpeningRaw],
  );

  useEffect(() => {
    const { rows: nextRows, suggestedOpening } = buildReceiptAllocationState(receiptRef.current, {
      ledger: openingLedger,
    });
    setRows(nextRows);
    const o = receiptRef.current.openingBalanceSettlementAmount ?? "0";
    const n = parseFloat(o) || 0;
    if (n > 0.001) {
      setOpeningDraft(sanitizeDecimalInput(o));
    } else if (suggestedOpening > 0.001) {
      setOpeningDraft(suggestedOpening.toFixed(2));
    } else {
      setOpeningDraft("");
    }
  }, [initKey, openingLedger]);

  const serverOpeningNum = parseFloat(receipt.openingBalanceSettlementAmount ?? "0") || 0;
  const openingNum = openingDraftToNum(openingDraft);
  const effectiveOpeningNum = showOpeningRow ? openingNum : serverOpeningNum;

  const totalReceipt = parseFloat(receipt.totalAmount ?? "0") || 0;
  const savePayload = useMemo(() => mergeAllocationsForSave(rows, receipt), [rows, receipt]);
  const invoicesIfSaved = totalAllocatedFromSavePayload(savePayload);
  const totalIfSaved = totalTaggedFromSavePayload(savePayload, effectiveOpeningNum);
  const remaining = totalReceipt - totalIfSaved;

  const openingUnchanged = showOpeningRow ? receiptOpeningUnchanged(openingDraft, receipt) : true;
  const noChanges = receiptAllocationsUnchanged(rows, receipt) && openingUnchanged;

  const updateAmount = (invoiceId: number, raw: string) => {
    const amount = sanitizeDecimalInput(raw);
    setRows((prev) => prev.map((r) => (r.invoiceId === invoiceId ? { ...r, amount } : r)));
  };

  const onSuggestAgain = () => {
    const { rows: nextRows, suggestedOpening } = buildReceiptAllocationState(receipt, {
      ledger: openingLedger,
    });
    setRows(nextRows);
    const o = receipt.openingBalanceSettlementAmount ?? "0";
    const n = parseFloat(o) || 0;
    if (n > 0.001) {
      setOpeningDraft(sanitizeDecimalInput(o));
    } else if (suggestedOpening > 0.001) {
      setOpeningDraft(suggestedOpening.toFixed(2));
    } else {
      setOpeningDraft("");
    }
  };

  const initialAllocByInvoiceId = useMemo(() => {
    const m = new Map<number, number>();
    for (const a of receipt.allocations ?? []) {
      m.set(a.invoiceId, parseFloat(a.amount) || 0);
    }
    return m;
  }, [receipt.allocations]);

  const rowOverInvoiceCap = (r: ReceiptAllocationRowState) => {
    const init = initialAllocByInvoiceId.get(r.invoiceId) ?? 0;
    const cap = maxReceiptAllocToInvoice(r, init);
    return (parseFloat(r.amount) || 0) > cap + 0.01;
  };

  const anyOverInvoiceCap = rows.some(rowOverInvoiceCap);

  const maxOpeningAlloc = showOpeningRow
    ? maxReceiptAllocToOpening(receipt, invoicesIfSaved, serverOpeningNum, openingLedger)
    : 0;
  const openingOverCap = showOpeningRow && openingNum > maxOpeningAlloc + 0.01;

  const hasTableRows = showOpeningRow || partyLoading || rows.length > 0;

  const onSave = async () => {
    if (totalIfSaved > totalReceipt + 0.001) {
      showErrorToast(
        `Tagged total (${formatCurrency(String(totalIfSaved))}) cannot exceed the receipt (${formatCurrency(receipt.totalAmount)}).`,
      );
      return;
    }
    if (openingOverCap) {
      showErrorToast(
        `Opening amount cannot exceed ${formatCurrency(String(maxOpeningAlloc))} for this receipt.`,
      );
      return;
    }
    if (showOpeningRow && !openingDisabled && serverOpeningNum > 0.001 && openingNum <= 0.001) {
      showErrorToast(
        null,
        "Opening allocation cannot be removed once it has been saved on this receipt.",
      );
      return;
    }
    const over = rows.find(rowOverInvoiceCap);
    if (over) {
      const init = initialAllocByInvoiceId.get(over.invoiceId) ?? 0;
      const cap = maxReceiptAllocToInvoice(over, init);
      showErrorToast(
        `Amount for ${over.invoiceNumber} cannot exceed ${formatCurrency(String(cap))} for this invoice.`,
      );
      return;
    }
    try {
      const body: PutReceiptAllocationsRequest = {
        allocations: savePayload,
      };
      if (showOpeningRow && Math.abs(openingNum - serverOpeningNum) > 0.005) {
        body.openingBalanceSettlementAmount = formatMoneyTwoDp(openingNum);
      }
      await updateAlloc.mutateAsync(body);
      showSuccessToast("Allocations updated");
      onSaved?.();
    } catch (e) {
      if (e instanceof ApiClientError) {
        showErrorToast(augmentApiClientErrorForReceipt(e), "Failed to update allocations");
      } else {
        showErrorToast(e, "Failed to update allocations");
      }
    }
  };

  const fmtOpening = (v: number | null) =>
    v != null && Number.isFinite(v) ? formatCurrency(String(v)) : "—";

  const openingTotalDisplay = fmtOpening(openingLedger.total);
  const openingPaidDisplay = fmtOpening(openingLedger.paid);
  const openingDueDisplay = fmtOpening(openingLedger.due);

  return (
    <Card id="allocate" className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
      <CardHeader className="space-y-1 border-b border-border/60 bg-muted/15 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Allocate this receipt
            </CardTitle>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Tag amounts to <span className="font-medium text-foreground">opening balance</span> or{" "}
              <span className="font-medium text-foreground">invoices</span> in the table below. Like
              invoices with no balance due, the opening line disappears when there is nothing left
              to settle against opening. The receipt stays one full money-in entry; tags are
              attribution only.{" "}
              {openingDisabled && (
                <span className="font-medium text-foreground">
                  Opening tags are not editable on opening-advance receipts.
                </span>
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={onSuggestAgain}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Reset suggestions
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/60 sm:p-0">
          <div className="flex flex-col justify-center px-4 py-3 sm:py-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Receipt total
            </span>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(receipt.totalAmount)}
            </p>
          </div>
          <div className="flex flex-col justify-center px-4 py-3 sm:py-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tagged on this form
            </span>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-primary">
              {formatCurrency(String(totalIfSaved))}
            </p>
          </div>
          <div className="flex flex-col justify-center px-4 py-3 sm:py-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Unallocated after save
            </span>
            <p
              className={cn(
                "mt-1 text-xl font-semibold tabular-nums tracking-tight",
                remaining > 0.001 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
              )}
            >
              {formatCurrency(String(Math.max(0, remaining)))}
            </p>
          </div>
        </div>

        {!hasTableRows ? (
          <div className="flex gap-4 rounded-xl border border-border/60 bg-muted/10 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground">
              <FileStack className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Nothing to allocate here</p>
              <p>
                There is no remaining opening balance to tag for this party, and no invoices with a
                balance due. If amounts are still applied to fully paid invoices, they stay on this
                receipt until those lines are available again.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Target
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Type
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      title="Opening: net debit opening (receivable) from the party profile or API"
                    >
                      Total
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      title="Opening: amount already tagged on other receipts"
                    >
                      Paid
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      title="Opening: remaining you can still tag toward this opening"
                    >
                      Due
                    </th>
                    <th className="min-w-[10.5rem] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground">
                      Allocate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partyLoading && !showOpeningRow && (
                    <tr
                      className={cn(
                        "border-b border-border/50 bg-muted/10",
                        rows.length === 0 && "last:border-0",
                      )}
                      aria-hidden
                    >
                      <td className="px-4 py-3 align-middle">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <Skeleton className={cn(ALLOC_INPUT_CLASS, "rounded-md")} />
                          <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  )}
                  {showOpeningRow && (
                    <tr
                      className={cn(
                        "border-b border-border/50 bg-muted/15 transition-colors hover:bg-muted/25",
                        rows.length === 0 && "last:border-0",
                      )}
                    >
                      <td className="px-4 py-3 align-middle font-medium">
                        <Link
                          href={`/parties/${receipt.partyId}/ledger`}
                          className="text-primary hover:underline"
                        >
                          Opening balance
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle text-muted-foreground">
                        {formatDate(party?.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground">Opening</td>
                      <td className="px-4 py-3 text-right align-middle tabular-nums text-muted-foreground">
                        {openingTotalDisplay}
                      </td>
                      <td className="px-4 py-3 text-right align-middle tabular-nums text-muted-foreground">
                        {openingPaidDisplay}
                      </td>
                      <td className="px-4 py-3 text-right align-middle font-medium tabular-nums">
                        {openingDueDisplay}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <Input
                              className={cn(
                                ALLOC_INPUT_CLASS,
                                openingOverCap &&
                                  "border-destructive focus-visible:ring-destructive/30",
                              )}
                              value={openingDraft}
                              disabled={openingDisabled}
                              onChange={(e) =>
                                setOpeningDraft(sanitizeDecimalInput(e.target.value))
                              }
                              onPaste={(e) => {
                                e.preventDefault();
                                const el = e.currentTarget;
                                const start = el.selectionStart ?? openingDraft.length;
                                const end = el.selectionEnd ?? openingDraft.length;
                                const pasted = e.clipboardData.getData("text");
                                const next =
                                  openingDraft.slice(0, start) + pasted + openingDraft.slice(end);
                                setOpeningDraft(sanitizeDecimalInput(next));
                                requestAnimationFrame(() => {
                                  const len = sanitizeDecimalInput(next).length;
                                  el.setSelectionRange(len, len);
                                });
                              }}
                              inputMode="decimal"
                              autoComplete="off"
                              spellCheck={false}
                              placeholder="0.00"
                              aria-label="Allocate to opening balance"
                            />
                            {/* Reserve slot width; opening tag cannot be cleared once saved */}
                            <div className={ALLOC_ACTION_SLOT} aria-hidden />
                          </div>
                          {openingOverCap && (
                            <span className="w-full max-w-[calc(7.25rem+0.375rem+2.25rem)] text-right text-[11px] text-destructive">
                              Max {formatCurrency(String(maxOpeningAlloc))}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => {
                    const alloc = parseFloat(r.amount) || 0;
                    const init = initialAllocByInvoiceId.get(r.invoiceId) ?? 0;
                    const cap = maxReceiptAllocToInvoice(r, init);
                    const overCap = alloc > cap + 0.01;
                    const canClearInvoiceRow = alloc > 0.001 || init > 0.001;
                    return (
                      <tr
                        key={r.invoiceId}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/25"
                      >
                        <td className="px-4 py-3 align-middle font-medium">
                          <Link
                            href={`/invoices/${r.invoiceId}`}
                            className="text-primary hover:underline"
                          >
                            {r.invoiceNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-middle text-muted-foreground">
                          {r.invoiceDate ? formatDate(r.invoiceDate) : "—"}
                        </td>
                        <td className="px-4 py-3 align-middle capitalize text-muted-foreground">
                          {(r.invoiceType ?? "—").replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 text-right align-middle tabular-nums">
                          {r.totalAmount === "—" ? "—" : formatCurrency(r.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right align-middle tabular-nums text-muted-foreground">
                          {r.paidAmount === "—" ? "—" : formatCurrency(r.paidAmount)}
                        </td>
                        <td className="px-4 py-3 text-right align-middle font-medium tabular-nums">
                          {formatCurrency(r.dueAmount)}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <Input
                                className={cn(
                                  ALLOC_INPUT_CLASS,
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
                              <div className={ALLOC_ACTION_SLOT}>
                                {canClearInvoiceRow && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                    title="Clear allocation"
                                    onClick={() => updateAmount(r.invoiceId, "")}
                                  >
                                    <Eraser className="h-4 w-4" aria-hidden />
                                    <span className="sr-only">
                                      Clear allocation for {r.invoiceNumber}
                                    </span>
                                  </Button>
                                )}
                              </div>
                            </div>
                            {overCap && (
                              <span className="w-full max-w-[calc(7.25rem+0.375rem+2.25rem)] text-right text-[11px] text-destructive">
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
                totalIfSaved > totalReceipt + 0.001 ||
                anyOverInvoiceCap ||
                openingOverCap ||
                noChanges
              }
              className="min-w-[140px]"
            >
              {updateAlloc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            {noChanges &&
              !anyOverInvoiceCap &&
              !openingOverCap &&
              totalIfSaved <= totalReceipt + 0.001 && (
                <p className="text-sm text-muted-foreground">No changes to save.</p>
              )}
            {totalIfSaved > totalReceipt + 0.001 && (
              <p className="text-sm text-destructive">
                Tagged total must not exceed the receipt amount.
              </p>
            )}
            {openingOverCap && totalIfSaved <= totalReceipt + 0.001 && (
              <p className="text-sm text-destructive">Opening row exceeds the allowed amount.</p>
            )}
            {anyOverInvoiceCap && totalIfSaved <= totalReceipt + 0.001 && !openingOverCap && (
              <p className="text-sm text-destructive">
                One or more invoice rows exceed what can be applied to that invoice.
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground sm:text-right">
            If you don&apos;t change opening, it isn&apos;t sent on save. A saved opening allocation
            cannot be removed here; you can still adjust the amount within allowed limits.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
