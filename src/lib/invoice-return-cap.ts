import { formatQty, getEntryTotalQty, toNum } from "@/lib/invoice-create";
import type { InvoiceItem } from "@/types/invoice";
import type { InvoiceLineDraft } from "@/types/invoice-create";
import type { StockEntry } from "@/types/item";

type LineCap = Pick<InvoiceLineDraft, "quantity" | "remainingReturnableQty" | "soldQuantity">;

/** Prefer API `quantityReturnableRemaining`; otherwise original line quantity. */
export function defaultLinkedReturnQuantity(
  invoiceItem: Pick<InvoiceItem, "quantity" | "quantityReturnableRemaining">,
): string {
  const rem = invoiceItem.quantityReturnableRemaining?.trim();
  if (rem !== undefined && rem !== "") return rem;
  return invoiceItem.quantity;
}

/** Purchase return: min(original qty, API remaining, batch on-hand). */
export function purchaseReturnMaxReturnableQtyStr(
  invoiceItem: Pick<InvoiceItem, "quantity" | "quantityReturnableRemaining">,
  stockEntry: StockEntry | null | undefined,
): string {
  const purchaseQty = Math.max(0, toNum(invoiceItem.quantity));
  let cap = purchaseQty;
  const apiStr = invoiceItem.quantityReturnableRemaining?.trim();
  if (apiStr !== undefined && apiStr !== "") {
    const apiRem = toNum(apiStr);
    if (Number.isFinite(apiRem) && apiRem >= 0) cap = Math.min(cap, apiRem);
  }
  if (stockEntry != null) {
    const onHand = getEntryTotalQty(stockEntry);
    if (Number.isFinite(onHand) && onHand >= 0) cap = Math.min(cap, onHand);
  }
  return formatQty(cap);
}

export function clampQuantityToRemainingCap(quantityStr: string, remainingStr: string): string {
  const cap = toNum(remainingStr.trim());
  const q = toNum(quantityStr);
  if (!Number.isFinite(cap) || cap < 0) return quantityStr;
  if (!Number.isFinite(q)) return quantityStr;
  if (q <= cap + 1e-9) return quantityStr;
  return formatQty(Math.min(q, cap));
}

export function getReturnQuantityCap(line: LineCap): number | null {
  const capStr = line.remainingReturnableQty?.trim() || line.soldQuantity?.trim() || "";
  if (capStr === "") return null;
  const cap = toNum(capStr);
  return cap > 0 && Number.isFinite(cap) ? cap : null;
}

export function isReturnQuantityOverCap(line: LineCap): boolean {
  const cap = getReturnQuantityCap(line);
  if (cap == null) return false;
  const ret = toNum(line.quantity);
  return ret > cap + 1e-9;
}
