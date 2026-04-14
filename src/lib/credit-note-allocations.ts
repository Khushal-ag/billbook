import type { CreditNoteDetail } from "@/types/credit-note";
import { maxReceiptAllocToInvoice } from "@/lib/receipt-allocations";

function num(s: string | undefined): number {
  const x = parseFloat(s ?? "0");
  return Number.isFinite(x) ? x : 0;
}

export type CreditNoteAllocationRowState = {
  invoiceId: number;
  invoiceNumber: string;
  invoiceType?: string;
  invoiceDate?: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  amount: string;
};

export type CreditNoteAllocationSaveLine = { invoiceId: number; amount: string };

export { maxReceiptAllocToInvoice as maxCreditNoteAllocToInvoice };

/**
 * Only invoices with due &gt; 0. Allocations to fully-paid (0 due) invoices stay on the server
 * and are merged on save — they are not shown as rows.
 */
export function buildCreditNoteAllocationRows(
  cn: CreditNoteDetail,
): CreditNoteAllocationRowState[] {
  const totalCn = num(cn.amount);
  const open = [...(cn.openInvoicesForParty ?? [])]
    .filter((i) => num(i.dueAmount) > 0.001)
    .sort(
      (a, b) =>
        String(a.invoiceDate ?? "").localeCompare(String(b.invoiceDate ?? "")) || a.id - b.id,
    );

  const usedTotal = (cn.allocations ?? []).reduce((s, a) => s + num(a.amount), 0);

  const amountForId = new Map<number, number>();
  for (const inv of open) {
    const saved = cn.allocations?.find((x) => x.invoiceId === inv.id);
    if (saved) {
      amountForId.set(inv.id, num(saved.amount));
    }
  }

  const poolFromMath = Math.max(0, totalCn - usedTotal);
  const apiUnalloc = num(cn.unallocatedAmount);
  const hasApiUnalloc =
    cn.unallocatedAmount != null &&
    cn.unallocatedAmount !== "" &&
    Number.isFinite(apiUnalloc) &&
    apiUnalloc >= 0;
  let pool = hasApiUnalloc ? Math.min(Math.max(0, apiUnalloc), poolFromMath + 0.01) : poolFromMath;

  for (const inv of open) {
    if (amountForId.has(inv.id)) continue;
    const due = num(inv.dueAmount);
    const take = Math.min(due, pool);
    amountForId.set(inv.id, take);
    pool -= take;
  }

  return open.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceType: inv.invoiceType,
    invoiceDate: inv.invoiceDate,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount ?? "0.00",
    dueAmount: inv.dueAmount,
    amount: (amountForId.get(inv.id) ?? 0).toFixed(2),
  }));
}

export function creditNoteAllocationInitKey(cn: CreditNoteDetail): string {
  const open = [...(cn.openInvoicesForParty ?? [])]
    .filter((i) => num(i.dueAmount) > 0.001)
    .sort(
      (a, b) =>
        String(a.invoiceDate ?? "").localeCompare(String(b.invoiceDate ?? "")) || a.id - b.id,
    );
  const allocPart = [...(cn.allocations ?? [])]
    .sort((a, b) => a.invoiceId - b.invoiceId)
    .map((a) => `${a.invoiceId}:${a.amount}`)
    .join("|");
  const openPart = open
    .map((inv) =>
      [
        inv.id,
        inv.invoiceNumber,
        inv.invoiceType ?? "",
        inv.invoiceDate ?? "",
        inv.totalAmount,
        inv.paidAmount ?? "",
        inv.dueAmount,
      ].join(":"),
    )
    .join("|");
  return [cn.id, cn.amount ?? "", cn.unallocatedAmount ?? "", allocPart, openPart].join("\u001e");
}

/** Payload for PUT: visible rows (&gt;0) + allocations on invoices not shown (0 due, etc.). */
export function mergeCreditNoteAllocationsForSave(
  rows: CreditNoteAllocationRowState[],
  cn: CreditNoteDetail,
): CreditNoteAllocationSaveLine[] {
  const rowIds = new Set(rows.map((r) => r.invoiceId));
  const out: CreditNoteAllocationSaveLine[] = [];

  for (const r of rows) {
    const v = num(r.amount);
    if (v > 0.001) {
      out.push({ invoiceId: r.invoiceId, amount: r.amount.trim() });
    }
  }

  for (const a of cn.allocations ?? []) {
    if (num(a.amount) <= 0.001) continue;
    if (rowIds.has(a.invoiceId)) continue;
    out.push({ invoiceId: a.invoiceId, amount: String(a.amount).trim() });
  }

  return out;
}

function allocationSignature(lines: CreditNoteAllocationSaveLine[]): string {
  return [...lines]
    .filter((l) => num(l.amount) > 0.001)
    .sort((a, b) => a.invoiceId - b.invoiceId)
    .map((l) => `${l.invoiceId}:${num(l.amount).toFixed(2)}`)
    .join("|");
}

export function creditNoteAllocationsUnchanged(
  rows: CreditNoteAllocationRowState[],
  cn: CreditNoteDetail,
): boolean {
  const next = mergeCreditNoteAllocationsForSave(rows, cn);
  const prev: CreditNoteAllocationSaveLine[] = (cn.allocations ?? [])
    .filter((a) => num(a.amount) > 0.001)
    .map((a) => ({ invoiceId: a.invoiceId, amount: String(a.amount).trim() }));
  return allocationSignature(next) === allocationSignature(prev);
}

export function totalAllocatedFromCreditNoteSavePayload(
  lines: CreditNoteAllocationSaveLine[],
): number {
  return lines.reduce((s, l) => s + num(l.amount), 0);
}
