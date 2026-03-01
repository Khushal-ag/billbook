export type ItemType = "STOCK" | "SERVICE";

export function getItemCategoryDisplay(item: Item): string {
  if (item.categoryName) return item.categoryName;
  if (typeof item.category === "string") return item.category;
  if (item.category && typeof item.category === "object") return item.category.name;
  return "—";
}

function formatTaxRate(r: string | null | undefined): string {
  if (r == null || r === "") return "0";
  const n = parseFloat(r);
  return Number.isNaN(n) ? r : n % 1 === 0 ? String(Math.round(n)) : r;
}

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

/** Unit from API: predefined or custom (for item unit dropdown). */
export interface Unit {
  id: number;
  value: string;
  label: string;
  type: ItemType;
}

export interface Item {
  id: number;
  businessId: number;
  name: string;
  type: ItemType;
  hsnCode: string | null;
  sacCode: string | null;
  categoryId: number | null;
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
  minStockThreshold?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ItemDetail extends Item {
  currentStock: number;
}

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
  minStockThreshold?: string | null;
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
  /** From GET /items/stock-entries list only */
  itemName?: string;
  unit?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  /** Per-batch quantity breakdown (when API returns it) */
  quantityPurchased?: string;
  quantityAdjusted?: string;
  quantitySold?: string;
  actualQuantity?: string;
}

export interface CreateStockEntryRequest {
  itemId: number;
  purchaseDate: string;
  quantity: string;
  sellingPrice?: string;
  purchasePrice?: string;
  supplierId?: number | null;
}

export interface StockListItem {
  itemId: number;
  itemName: string;
  unit: string;
  categoryId: number | null;
  categoryName: string | null;
  minStockThreshold: string | null;
  quantityPurchased: string;
  quantityAdjusted: string;
  quantitySold: string;
  actualQuantity: string;
  stockValue: string | null;
  /** Balance × latest purchase price */
  purchasedValue?: string | null;
  isLowStock: boolean;
  /** Number of purchase batches for this item */
  stockEntriesCount?: number;
}

/** GET /api/items/stock summary – stock value totals */
export interface StockValueSummary {
  totalItems: number;
  totalQuantity: string;
  totalAmount: string;
  totalPurchasedValue: string;
}

/** GET /api/items/stock summary – low stock totals */
export interface LowStockSummary {
  totalItems: number;
  totalQuantity: string;
}

export interface StockListResponse {
  stock: StockListItem[];
  count: number;
  total: number;
  summary: {
    stockValue: StockValueSummary;
    lowStock: LowStockSummary;
  };
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

export interface ItemLedgerResponse {
  ledger: StockLedgerRow[];
  count: number;
}

export interface AdjustStockRequest {
  quantity: string;
  reason: string;
  /** Optional: attribute adjustment to this stock entry (batch) */
  stockEntryId?: number;
}

export interface ItemListResponse {
  items: Item[];
  count: number;
  total: number;
}

export interface StockEntryListResponse {
  entries: StockEntry[];
  count: number;
  total?: number;
}
