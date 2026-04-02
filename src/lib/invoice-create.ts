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

/** Sum of CGST+SGST+IGST %: draft line fields win; if blank, use linked catalog `item` (purchase batch / item master). */
function lineGstTotalPercent(line: InvoiceLineDraft): number {
  const pick = (draft: string, itemVal: string | null | undefined) =>
    draft.trim() !== "" ? toNum(draft) : toNum(itemVal?.trim() ?? "0");
  const cgst = pick(line.cgstRate, line.item?.cgstRate);
  const sgst = pick(line.sgstRate, line.item?.sgstRate);
  const igst = pick(line.igstRate, line.item?.igstRate);
  return Math.max(0, cgst + sgst + igst);
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
