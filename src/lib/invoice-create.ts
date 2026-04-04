import type { InvoiceItemInput } from "@/types/invoice";
import type { Item, StockEntry } from "@/types/item";
import { isServiceType, normalizeItemType } from "@/types/item";
import type { InvoiceLineDraft } from "@/types/invoice-create";

/** Build a full Item from a stock-entry row (list API embeds item name/type, etc.). */
export function itemFromStockEntry(entry: StockEntry): Item {
  const emb = entry.item;
  const partial = emb as Partial<Item> | undefined;
  return {
    id: entry.itemId,
    businessId: entry.businessId,
    name: emb?.name ?? entry.itemName ?? `Item #${entry.itemId}`,
    type: normalizeItemType(entry.itemType ?? (partial?.type as string | undefined)),
    hsnCode: partial?.hsnCode ?? null,
    sacCode: partial?.sacCode ?? null,
    categoryId: entry.categoryId ?? partial?.categoryId ?? null,
    categoryName: entry.categoryName ?? partial?.categoryName,
    unit: entry.unit ?? partial?.unit ?? "PCS",
    description: partial?.description ?? null,
    isTaxable: partial?.isTaxable,
    taxType: partial?.taxType,
    cgstRate: partial?.cgstRate ?? null,
    sgstRate: partial?.sgstRate ?? null,
    igstRate: partial?.igstRate ?? null,
    otherTaxName: partial?.otherTaxName,
    otherTaxRate: partial?.otherTaxRate,
    minStockThreshold: partial?.minStockThreshold,
    isActive: true,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function createLine(): InvoiceLineDraft {
  return {
    id: crypto.randomUUID(),
    item: null,
    stockEntryId: null,
    itemName: "",
    hsnCode: "",
    sacCode: "",
    quantity: "1",
    unitPrice: "",
    sellingPrice: "",
    discountPercent: "",
    discountAmount: "",
    cgstRate: "0",
    sgstRate: "0",
    igstRate: "0",
  };
}

export function toNum(v: string | null | undefined): number {
  const n = Number(v ?? "0");
  return Number.isFinite(n) ? n : 0;
}

/** Selling rate per unit: purchase × (1 + margin%/100). Empty string if purchase rate is invalid. */
export function sellingPriceFromPurchaseAndMargin(
  purchaseRate: string,
  marginPercent: string,
): string {
  const rate = Math.max(0, toNum(purchaseRate));
  if (rate <= 0) return "";
  const m = Math.max(0, toNum(marginPercent));
  const sp = rate * (1 + m / 100);
  if (!Number.isFinite(sp)) return "";
  return sp.toFixed(2);
}

/**
 * IGST % equals CGST % + SGST % for the same slab. Used when the user edits CGST/SGST so IGST
 * stays in sync; also for payload/display. Empty inputs are treated as 0 when the other side has a value.
 */
export function formatIgstFromCgstSgst(cgst: string, sgst: string): string {
  const c = cgst.trim();
  const s = sgst.trim();
  if (c === "" && s === "") return "";
  const sum = toNum(c === "" ? "0" : cgst) + toNum(s === "" ? "0" : sgst);
  const rounded = Math.round(sum * 100) / 100;
  if (!Number.isFinite(rounded)) return "";
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

export function formatQty(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(3)));
}

/** Service lines are not limited by batch quantity on invoices. */
export function isDraftLineServiceItem(line: Pick<InvoiceLineDraft, "item">): boolean {
  return isServiceType(line.item?.type);
}

export function getEntryTotalQty(entry: StockEntry): number {
  const raw = entry.actualQuantity ?? entry.quantity;
  return Math.max(0, toNum(typeof raw === "string" ? raw : String(raw)));
}

export function getEntryDateIso(entry: StockEntry): string {
  if (entry.purchaseDate) return entry.purchaseDate.slice(0, 10);
  return (entry.createdAt || "").slice(0, 10);
}

/**
 * Effective GST % on a line for totals: CGST+SGST (intra) or IGST alone — never sum intra + IGST.
 *
 * Draft fields win over item master: if the user clears CGST/SGST and only sets IGST (inter-state),
 * we must not pull CGST/SGST from the catalog or taxable/tax will be wrong.
 */
function lineGstTotalPercent(line: InvoiceLineDraft): number {
  const cTrim = line.cgstRate.trim();
  const sTrim = line.sgstRate.trim();
  const iTrim = line.igstRate.trim();

  const hasExplicitCgst = cTrim !== "";
  const hasExplicitSgst = sTrim !== "";
  const hasExplicitIgst = iTrim !== "";

  if (hasExplicitCgst || hasExplicitSgst) {
    const c = hasExplicitCgst ? toNum(line.cgstRate) : 0;
    const s = hasExplicitSgst ? toNum(line.sgstRate) : 0;
    const intra = c + s;
    if (intra > 0) return Math.max(0, intra);
  }

  if (hasExplicitIgst) {
    return Math.max(0, toNum(line.igstRate));
  }

  const cItem = toNum(line.item?.cgstRate?.trim() ?? "0");
  const sItem = toNum(line.item?.sgstRate?.trim() ?? "0");
  const intraItem = cItem + sItem;
  if (intraItem > 0) return Math.max(0, intraItem);
  return Math.max(0, toNum(line.item?.igstRate?.trim() ?? "0"));
}

/** Purchase API `items[]` GST fields: same rules as {@link lineGstTotalPercent}. */
export function effectivePurchaseLineGstPayload(
  line: InvoiceLineDraft,
): Pick<InvoiceItemInput, "cgstRate" | "sgstRate" | "igstRate"> {
  const pickStr = (draft: string, itemVal: string | null | undefined): string => {
    if (draft.trim() !== "") return draft.trim();
    const i = itemVal?.trim();
    if (i !== undefined && i !== "") return i;
    return "0";
  };
  return {
    cgstRate: pickStr(line.cgstRate, line.item?.cgstRate),
    sgstRate: pickStr(line.sgstRate, line.item?.sgstRate),
    igstRate: pickStr(line.igstRate, line.item?.igstRate),
  };
}

export function getLineAmounts(line: InvoiceLineDraft) {
  const qty = Math.max(0, toNum(line.quantity));
  const unitPrice = Math.max(0, toNum(line.unitPrice));
  const gross = qty * unitPrice;

  const discountAmountInput = Math.max(0, toNum(line.discountAmount));
  const discPercent = Math.min(100, Math.max(0, toNum(line.discountPercent)));
  const taxRate = lineGstTotalPercent(line);

  const percentDiscount = (gross * discPercent) / 100;
  /** Prefer % when set so line discount scales with qty × rate; else fixed ₹ amount. */
  const lineDiscount = Math.min(
    gross,
    line.discountPercent.trim() !== ""
      ? percentDiscount
      : line.discountAmount.trim() !== ""
        ? discountAmountInput
        : 0,
  );
  const taxable = Math.max(0, gross - lineDiscount);
  const tax = (taxable * taxRate) / 100;
  const total = taxable + tax;

  return { gross, lineDiscount, taxable, tax, total };
}

function getLineEntry(line: InvoiceLineDraft, entries: StockEntry[]): StockEntry | undefined {
  if (line.stockEntryId == null) return undefined;
  return entries.find((entry) => entry.id === line.stockEntryId);
}

export function getSalesUnitPriceFloor(
  line: InvoiceLineDraft,
  entries: StockEntry[],
): number | null {
  const entry = getLineEntry(line, entries);
  if (!entry) return null;
  const floor = Math.max(0, toNum(entry.sellingPrice));
  return Number.isFinite(floor) ? floor : null;
}

export function getMaxAllowedDiscountPercent(
  line: InvoiceLineDraft,
  entries: StockEntry[],
): number {
  const entry = getLineEntry(line, entries);
  if (!entry) return 100;

  const sellingPrice = Math.max(0, toNum(line.unitPrice || entry.sellingPrice));
  const costPrice = Math.max(0, toNum(entry.purchasePrice ?? "0"));

  if (sellingPrice <= 0) return 0;
  if (costPrice <= 0) return 100;
  if (costPrice >= sellingPrice) return 0;

  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

export function getMaxAllowedDiscountAmount(line: InvoiceLineDraft, entries: StockEntry[]): number {
  const entry = getLineEntry(line, entries);
  if (!entry) return Number.POSITIVE_INFINITY;

  const qty = Math.max(0, toNum(line.quantity));
  const sellingPrice = Math.max(0, toNum(line.unitPrice || entry.sellingPrice));
  const costPrice = Math.max(0, toNum(entry.purchasePrice ?? "0"));

  if (qty <= 0 || sellingPrice <= 0) return 0;
  if (costPrice <= 0) return qty * sellingPrice;
  if (costPrice >= sellingPrice) return 0;

  return qty * (sellingPrice - costPrice);
}

export function getCostFloorViolation(
  line: InvoiceLineDraft,
  entries: StockEntry[],
): { netUnitPrice: number; costPrice: number } | null {
  const entry = getLineEntry(line, entries);
  if (!entry) return null;

  const sellingPrice = Math.max(0, toNum(line.unitPrice || entry.sellingPrice));
  const costPrice = Math.max(0, toNum(entry.purchasePrice ?? "0"));
  const qty = Math.max(0, toNum(line.quantity));
  if (sellingPrice <= 0 || costPrice <= 0 || qty <= 0) return null;

  const gross = qty * sellingPrice;
  const discountPercent = Math.min(100, Math.max(0, toNum(line.discountPercent)));
  const discountAmountInput = Math.max(0, toNum(line.discountAmount));
  const percentDiscount = (gross * discountPercent) / 100;
  const lineDiscount = Math.min(
    gross,
    line.discountPercent.trim() !== ""
      ? percentDiscount
      : line.discountAmount.trim() !== ""
        ? discountAmountInput
        : 0,
  );
  const netUnitPrice = Math.max(0, (gross - lineDiscount) / qty);

  if (netUnitPrice < costPrice) {
    return { netUnitPrice, costPrice };
  }
  return null;
}
