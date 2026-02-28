/**
 * Types for Items & Stock API (/api/items)
 * Item master: no selling/purchase price. Stock entries hold prices per batch.
 */

export type ItemType = "STOCK" | "SERVICE";

/** Display label for item category (API returns categoryName; fallback to legacy category). */
export function getItemCategoryDisplay(item: Item): string {
  if (item.categoryName) return item.categoryName;
  if (typeof item.category === "string") return item.category;
  if (item.category && typeof item.category === "object") return item.category.name;
  return "—";
}

/** Format rate string for display (e.g. "9.00" → "9", "12.5" → "12.5") */
function formatTaxRate(r: string | null | undefined): string {
  if (r == null || r === "") return "0";
  const n = parseFloat(r);
  return Number.isNaN(n) ? r : n % 1 === 0 ? String(Math.round(n)) : r;
}

/** Display label for item tax (GST, other, or —). */
export function getItemTaxDisplay(item: Item): string {
  if (item.isTaxable === false) return "—";
  if (item.taxType === "OTHER" && item.otherTaxName) {
    return `${item.otherTaxName} ${formatTaxRate(item.otherTaxRate)}%`;
  }
  const igst = item.igstRate ? parseFloat(item.igstRate) : 0;
  const cgst = item.cgstRate ? parseFloat(item.cgstRate) : 0;
  const sgst = item.sgstRate ? parseFloat(item.sgstRate) : 0;
  const hasIntra = cgst > 0 || sgst > 0;
  const hasInter = igst > 0;
  if (hasIntra && hasInter) {
    const intra =
      cgst > 0 && sgst > 0
        ? `${formatTaxRate(item.cgstRate)}% + ${formatTaxRate(item.sgstRate)}%`
        : `GST ${formatTaxRate(item.cgstRate || item.sgstRate)}%`;
    return `${intra} / IGST ${formatTaxRate(item.igstRate)}%`;
  }
  if (hasInter) return `IGST ${formatTaxRate(item.igstRate)}%`;
  if (cgst > 0 && sgst > 0)
    return `${formatTaxRate(item.cgstRate)}% + ${formatTaxRate(item.sgstRate)}%`;
  if (hasIntra) return `GST ${formatTaxRate(item.cgstRate || item.sgstRate)}%`;
  return "—";
}

export interface Category {
  id: number;
  businessId: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: number;
  businessId: number;
  name: string;
  type: ItemType;
  hsnCode: string | null;
  sacCode: string | null;
  categoryId: number | null;
  /** API returns categoryName in list/get. Kept for backward compat. */
  categoryName?: string | null;
  category?: string | { id: number; name: string } | null;
  unit: string;
  description: string | null;
  isTaxable?: boolean;
  taxType?: "GST" | "OTHER";
  cgstRate: string | null;
  sgstRate: string | null;
  igstRate: string | null;
  otherTaxName?: string | null;
  otherTaxRate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** GET /items/:itemId — includes currentStock from ledger */
export interface ItemDetail extends Item {
  currentStock: number;
}

/** Matches API: POST /api/items and PUT /api/items/:itemId body. */
export interface CreateItemRequest {
  name: string;
  type: ItemType;
  hsnCode?: string | null;
  sacCode?: string | null;
  categoryId?: number | null;
  unit?: string;
  description?: string | null;
  isTaxable?: boolean;
  taxType?: "GST" | "OTHER";
  cgstRate?: string | null;
  sgstRate?: string | null;
  igstRate?: string | null;
  otherTaxName?: string | null;
  otherTaxRate?: string | null;
}

export interface StockEntry {
  id: number;
  businessId: number;
  itemId: number;
  purchaseDate: string;
  quantity: string | number;
  sellingPrice: string;
  purchasePrice: string;
  supplierId: number | null;
  createdAt: string;
  updatedAt: string;
  item?: { id: number; name: string };
}

/** Swagger: quantity is string (pattern ^\\d+(\\.\\d{1,2})?$). */
export interface CreateStockEntryRequest {
  itemId: number;
  purchaseDate: string;
  quantity: string;
  sellingPrice?: string;
  purchasePrice?: string;
  supplierId?: number | null;
}

export interface StockReportRow {
  itemId: number;
  itemName: string;
  unit: string;
  /** API returns decimal strings */
  quantityPurchased: number | string;
  quantityAdjusted: number | string;
  quantitySold: number | string;
  actualQuantity: number | string;
}

export interface StockReportResponse {
  stock?: StockReportRow[];
  items?: StockReportRow[];
}

export type LedgerMovementType = "PURCHASE" | "ADJUSTMENT" | "SALE";

export interface StockLedgerRow {
  id: number;
  businessId: number;
  itemId: number;
  movementType: LedgerMovementType;
  quantity: number;
  referenceId: number | null;
  referenceType: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

/** GET /items/:itemId/ledger response: { ledger, count } */
export interface ItemLedgerResponse {
  ledger: StockLedgerRow[];
  count: number;
}

/** Swagger: quantity is string (pattern ^-?\\d+(\\.\\d{1,2})?$). */
export interface AdjustStockRequest {
  quantity: string;
  reason: string;
}

export interface ItemListResponse {
  items: Item[];
  count: number;
  total: number;
}

export interface StockEntryListResponse {
  entries?: StockEntry[];
  count?: number;
}
