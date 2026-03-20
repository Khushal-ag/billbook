import type { ReceiptDetail } from "@/types/receipt";

function num(s: string | undefined): number {
  const x = parseFloat(s ?? "0");
  return Number.isFinite(x) ? x : 0;
}

export type ReceiptAllocationRowState = {
  invoiceId: number;
  invoiceNumber: string;
  invoiceType?: string;
  invoiceDate?: string;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  amount: string;
};

export type ReceiptAllocationSaveLine = { invoiceId: number; amount: string };

/**
 * Max this receipt may allocate to an invoice. "Due" in the UI is after this receipt's payment
 * is applied, so comparing alloc to due falsely flags valid rows. Use:
 * total − (paid − amountAlreadyFromThisReceipt) = total − paid + initialFromReceipt.
 */
export function maxReceiptAllocToInvoice(
  row: Pick<ReceiptAllocationRowState, "totalAmount" | "paidAmount" | "dueAmount">,
  initialFromThisReceipt: number,
): number {
  const T = num(row.totalAmount);
  const P = num(row.paidAmount);
  if (T > 0.001 && row.totalAmount !== "—" && Number.isFinite(P)) {
    return Math.max(0, T - P + initialFromThisReceipt);
  }
  const D = num(row.dueAmount);
  return Math.max(0, D + initialFromThisReceipt);
}

/**
 * Only invoices with due &gt; 0. Allocations to fully-paid (0 due) invoices stay on the server
 * and are merged on save — they are not shown as rows.
 */
export function buildReceiptAllocationRows(receipt: ReceiptDetail): ReceiptAllocationRowState[] {
  const totalReceipt = num(receipt.totalAmount);
  const open = [...(receipt.openInvoicesForParty ?? [])]
    .filter((i) => num(i.dueAmount) > 0.001)
    .sort(
      (a, b) =>
        String(a.invoiceDate ?? "").localeCompare(String(b.invoiceDate ?? "")) || a.id - b.id,
    );

  const usedTotal = (receipt.allocations ?? []).reduce((s, a) => s + num(a.amount), 0);

  const amountForId = new Map<number, number>();
  for (const inv of open) {
    const saved = receipt.allocations?.find((x) => x.invoiceId === inv.id);
    if (saved) {
      amountForId.set(inv.id, num(saved.amount));
    }
  }

  const poolFromMath = Math.max(0, totalReceipt - usedTotal);
  const apiUnalloc = num(receipt.unallocatedAmount);
  const hasApiUnalloc =
    receipt.unallocatedAmount != null &&
    receipt.unallocatedAmount !== "" &&
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

/** Payload for PUT: visible rows (&gt;0) + allocations on invoices not shown (0 due, etc.). */
export function mergeAllocationsForSave(
  rows: ReceiptAllocationRowState[],
  receipt: ReceiptDetail,
): ReceiptAllocationSaveLine[] {
  const rowIds = new Set(rows.map((r) => r.invoiceId));
  const out: ReceiptAllocationSaveLine[] = [];

  for (const r of rows) {
    const v = num(r.amount);
    if (v > 0.001) {
      out.push({ invoiceId: r.invoiceId, amount: r.amount.trim() });
    }
  }

  for (const a of receipt.allocations ?? []) {
    if (num(a.amount) <= 0.001) continue;
    if (rowIds.has(a.invoiceId)) continue;
    out.push({ invoiceId: a.invoiceId, amount: String(a.amount).trim() });
  }

  return out;
}

function allocationSignature(lines: ReceiptAllocationSaveLine[]): string {
  return [...lines]
    .filter((l) => num(l.amount) > 0.001)
    .sort((a, b) => a.invoiceId - b.invoiceId)
    .map((l) => `${l.invoiceId}:${num(l.amount).toFixed(2)}`)
    .join("|");
}

export function receiptAllocationsUnchanged(
  rows: ReceiptAllocationRowState[],
  receipt: ReceiptDetail,
): boolean {
  const next = mergeAllocationsForSave(rows, receipt);
  const prev: ReceiptAllocationSaveLine[] = (receipt.allocations ?? [])
    .filter((a) => num(a.amount) > 0.001)
    .map((a) => ({ invoiceId: a.invoiceId, amount: String(a.amount).trim() }));
  return allocationSignature(next) === allocationSignature(prev);
}

export function totalAllocatedFromSavePayload(lines: ReceiptAllocationSaveLine[]): number {
  return lines.reduce((s, l) => s + num(l.amount), 0);
}
