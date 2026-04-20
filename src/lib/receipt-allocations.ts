import type { ReceiptDetail } from "@/types/receipt";
import { openingBalanceFromApi } from "@/lib/party-opening-balance";

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

/** Opening-balance ledger snapshot for the opening row (Total / Paid / Due). */
export type OpeningLedger = {
  total: number | null;
  paid: number | null;
  due: number | null;
};

/** Empty ledger used when party data isn't loaded yet or there is no opening. */
export const EMPTY_OPENING_LEDGER: OpeningLedger = { total: null, paid: null, due: null };

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
 * Pool left on this receipt for new tags + suggested opening (opening is filled first, then invoices).
 * Caller should pass the shared {@link OpeningLedger}; when absent we derive it from
 * `partyOpeningBalanceRaw` so ad‑hoc callers still work.
 */
export function buildReceiptAllocationState(
  receipt: ReceiptDetail,
  options?: {
    /** Precomputed opening ledger — preferred; avoids recomputing caps. */
    ledger?: OpeningLedger;
    /** Party `openingBalance` raw string; used only when {@link ledger} isn't provided. */
    partyOpeningBalanceRaw?: string | null;
  },
): {
  rows: ReceiptAllocationRowState[];
  /** Suggested opening tag when server has none — min(pool, party cap). */
  suggestedOpening: number;
} {
  const ledger =
    options?.ledger ?? deriveOpeningLedgerAmounts(receipt, options?.partyOpeningBalanceRaw ?? null);

  const totalReceipt = num(receipt.totalAmount);
  const open = [...(receipt.openInvoicesForParty ?? [])]
    .filter((i) => num(i.dueAmount) > 0.001)
    .sort(
      (a, b) =>
        String(a.invoiceDate ?? "").localeCompare(String(b.invoiceDate ?? "")) || a.id - b.id,
    );

  const usedInvoices = (receipt.allocations ?? []).reduce((s, a) => s + num(a.amount), 0);
  const usedOpening = num(receipt.openingBalanceSettlementAmount ?? "0");
  const usedTotal = usedInvoices + usedOpening;

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
  const pool = hasApiUnalloc
    ? Math.min(Math.max(0, apiUnalloc), poolFromMath + 0.01)
    : poolFromMath;

  const maxOpenTag = maxReceiptAllocToOpening(receipt, 0, usedOpening, ledger);
  const takeOpening = Math.min(pool, maxOpenTag);
  let poolInv = pool - takeOpening;

  for (const inv of open) {
    if (amountForId.has(inv.id)) continue;
    const due = num(inv.dueAmount);
    const take = Math.min(due, poolInv);
    amountForId.set(inv.id, take);
    poolInv -= take;
  }

  const suggestedOpening =
    usedOpening <= 0.001 && takeOpening > 0.001 ? Math.round(takeOpening * 100) / 100 : 0;

  const rows = open.map((inv) => ({
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceType: inv.invoiceType,
    invoiceDate: inv.invoiceDate,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount ?? "0.00",
    dueAmount: inv.dueAmount,
    amount: (amountForId.get(inv.id) ?? 0).toFixed(2),
  }));

  return { rows, suggestedOpening };
}

/**
 * Only invoices with due > 0. Allocations to fully-paid (0 due) invoices stay on the server
 * and are merged on save — they are not shown as rows.
 */
export function buildReceiptAllocationRows(receipt: ReceiptDetail): ReceiptAllocationRowState[] {
  return buildReceiptAllocationState(receipt).rows;
}

/**
 * Stable key for inputs to {@link buildReceiptAllocationRows}. When unchanged, a new `receipt`
 * object reference alone should not reset editor state. Includes party opening so a change in
 * the party profile (e.g. `openingBalance` loaded after initial render) triggers reinit.
 */
export function receiptAllocationInitKey(
  receipt: ReceiptDetail,
  partyOpeningBalanceRaw?: string | null,
): string {
  const open = [...(receipt.openInvoicesForParty ?? [])]
    .filter((i) => num(i.dueAmount) > 0.001)
    .sort(
      (a, b) =>
        String(a.invoiceDate ?? "").localeCompare(String(b.invoiceDate ?? "")) || a.id - b.id,
    );
  const allocPart = [...(receipt.allocations ?? [])]
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
  return [
    receipt.id,
    receipt.totalAmount ?? "",
    receipt.unallocatedAmount ?? "",
    receipt.openingBalanceSettlementAmount ?? "",
    receipt.partyOpeningRemaining ?? "",
    receipt.partyNetOpening ?? "",
    receipt.partyOpeningSettledOnOtherReceipts ?? "",
    partyOpeningBalanceRaw ?? "",
    allocPart,
    openPart,
  ].join("\u001e");
}

/** Payload for PUT: visible rows (>0) + allocations on invoices not shown (0 due, etc.). */
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

export function receiptOpeningUnchanged(openingDraft: string, receipt: ReceiptDetail): boolean {
  const draftNum = num(openingDraft.trim() === "" ? "0" : openingDraft);
  const serverNum = num(receipt.openingBalanceSettlementAmount ?? "0");
  return Math.abs(draftNum - serverNum) < 0.005;
}

export function totalAllocatedFromSavePayload(lines: ReceiptAllocationSaveLine[]): number {
  return lines.reduce((s, l) => s + num(l.amount), 0);
}

/** Invoice allocations from the form plus opening tag (for caps vs receipt total). */
export function totalTaggedFromSavePayload(
  lines: ReceiptAllocationSaveLine[],
  openingAmount: number,
): number {
  return totalAllocatedFromSavePayload(lines) + openingAmount;
}

/**
 * Whether to show the opening row in the allocate table.
 *
 * Like fully-paid invoices, the opening line is hidden as soon as remaining is 0. The receipt's
 * existing `openingBalanceSettlementAmount` is still visible in the read-only
 * "Where this receipt is tagged" summary — and the editor surfaces a "Clear opening tag"
 * affordance when the row is hidden but this receipt still holds a tag.
 */
export function shouldShowOpeningBalanceRow(
  receipt: ReceiptDetail,
  ledger: OpeningLedger,
): boolean {
  if (receipt.paymentMethod === "OPENING_BALANCE") return false;
  const rem =
    receipt.partyOpeningRemaining != null && String(receipt.partyOpeningRemaining).trim() !== ""
      ? num(receipt.partyOpeningRemaining)
      : null;
  if (rem != null && Number.isFinite(rem)) {
    return rem > 0.001;
  }
  if (ledger.total == null) return false;
  return (ledger.due ?? 0) > 0.001;
}

/**
 * Max amount this receipt may tag to opening: receipt remainder capped by party remaining
 * (same pattern as invoice due + initial from this receipt).
 */
export function maxReceiptAllocToOpening(
  receipt: ReceiptDetail,
  invoiceAllocSum: number,
  initialOpeningFromThisReceipt: number,
  ledger: OpeningLedger,
): number {
  const total = num(receipt.totalAmount);
  const byReceipt = Math.max(0, total - invoiceAllocSum);
  const raw = receipt.partyOpeningRemaining;
  if (raw != null && String(raw).trim() !== "") {
    const partyRem = num(raw);
    const byParty = Math.max(0, partyRem + initialOpeningFromThisReceipt);
    return Math.min(byReceipt, byParty);
  }
  if (ledger.total != null) {
    const inferredCap = Math.round(((ledger.due ?? 0) + initialOpeningFromThisReceipt) * 100) / 100;
    return Math.min(byReceipt, Math.max(0, inferredCap));
  }
  return byReceipt;
}

/**
 * Net opening (Total), settled elsewhere (Paid), remaining (Due) for the opening row.
 * Fills gaps when the API only sends some fields; uses party debit opening for Total when needed.
 * When the API omits `partyOpeningRemaining`, infers Paid = other receipts' settlements + this
 * receipt's own opening tag (so a fully tagged opening doesn't look "all due").
 */
export function deriveOpeningLedgerAmounts(
  receipt: ReceiptDetail,
  partyOpeningBalanceRaw: string | null | undefined,
): OpeningLedger {
  let total: number | null =
    receipt.partyNetOpening != null && String(receipt.partyNetOpening).trim() !== ""
      ? num(receipt.partyNetOpening)
      : null;
  if (total == null) {
    const ob = openingBalanceFromApi(partyOpeningBalanceRaw ?? null);
    if (ob.nature === "DEBIT" && ob.amount.trim() !== "") {
      const n = parseFloat(ob.amount.replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0.0001) total = n;
    }
  }

  if (total == null) {
    return { total: null, paid: null, due: null };
  }

  const has = (s: string | null | undefined) => s != null && String(s).trim() !== "";
  let paid: number | null = has(receipt.partyOpeningSettledOnOtherReceipts)
    ? num(receipt.partyOpeningSettledOnOtherReceipts ?? undefined)
    : null;
  let due: number | null = has(receipt.partyOpeningRemaining)
    ? num(receipt.partyOpeningRemaining ?? undefined)
    : null;

  const hasPartyRemaining = has(receipt.partyOpeningRemaining);

  if (paid != null && due == null) {
    due = Math.max(0, Math.round((total - paid) * 100) / 100);
  } else if (due != null && paid == null) {
    paid = Math.max(0, Math.round((total - due) * 100) / 100);
  } else if (paid == null && due == null) {
    paid = 0;
    due = total;
  }

  if (!hasPartyRemaining) {
    const otherPaid = has(receipt.partyOpeningSettledOnOtherReceipts)
      ? num(receipt.partyOpeningSettledOnOtherReceipts ?? undefined)
      : 0;
    const taggedHere = num(receipt.openingBalanceSettlementAmount ?? "0");
    const covered = Math.round((otherPaid + taggedHere) * 100) / 100;
    paid = Math.min(total, covered);
    due = Math.max(0, Math.round((total - covered) * 100) / 100);
  }

  return { total, paid: paid ?? 0, due: due ?? 0 };
}
