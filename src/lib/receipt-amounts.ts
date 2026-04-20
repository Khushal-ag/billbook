/** Money helpers for receipts (opening settlement + invoice allocations). */

export function moneyNum(s: string | undefined | null): number {
  const x = parseFloat(String(s ?? "0"));
  return Number.isFinite(x) ? x : 0;
}

export type ReceiptMoneyShape = {
  totalAmount: string;
  allocatedAmount?: string | null;
  unallocatedAmount?: string | null;
  openingBalanceSettlementAmount?: string | null;
  allocations?: { amount: string }[];
};

export function receiptInvoiceAllocationSum(r: ReceiptMoneyShape): number {
  return (r.allocations ?? []).reduce((s, a) => s + moneyNum(a.amount), 0);
}

export function receiptOpeningSettlementNum(r: ReceiptMoneyShape): number {
  return moneyNum(r.openingBalanceSettlementAmount ?? "0");
}

/**
 * Prefer API `allocatedAmount` (includes opening tag). Otherwise derive from lines + opening.
 */
export function receiptAllocatedAmountNum(r: ReceiptMoneyShape): number {
  if (r.allocatedAmount != null && String(r.allocatedAmount).trim() !== "") {
    const a = moneyNum(r.allocatedAmount);
    if (Number.isFinite(a)) return a;
  }
  return receiptInvoiceAllocationSum(r) + receiptOpeningSettlementNum(r);
}

export function receiptUnallocatedAmountNum(r: ReceiptMoneyShape): number {
  if (r.unallocatedAmount != null && String(r.unallocatedAmount).trim() !== "") {
    const u = moneyNum(r.unallocatedAmount);
    if (Number.isFinite(u)) return Math.max(0, u);
  }
  const total = moneyNum(r.totalAmount);
  return Math.max(0, total - receiptAllocatedAmountNum(r));
}

export function formatMoneyTwoDp(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0.00";
  return (Math.round(n * 100) / 100).toFixed(2);
}
