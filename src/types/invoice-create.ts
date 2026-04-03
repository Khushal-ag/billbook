import type { Item, StockEntry } from "@/types/item";

export interface InvoiceLineDraft {
  id: string;
  item: Item | null;
  stockEntryId: number | null;
  /** Free text from vendor bill (PURCHASE_INVOICE without batch); optional override when batch linked. */
  itemName: string;
  /** Optional HSN/SAC override or vendor-line codes (purchase). */
  hsnCode: string;
  sacCode: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  discountAmount: string;
  cgstRate: string;
  sgstRate: string;
  igstRate: string;
  /** Original qty on the source sale invoice (sales return — display / max return qty). */
  soldQuantity?: string;
  /** When false, line is excluded from the return document and totals. */
  selectedForReturn?: boolean;
}

export interface StockChoice {
  entry: StockEntry;
  item: Item;
  availableQty: number;
  usedQty: number;
  remainingQty: number;
  enabledForSelection: boolean;
}

export interface StockLineIssue {
  lineId: string;
  entryId: number;
  itemName: string;
  selectedQty: number;
  availableQty: number;
  suggestedQty: number;
  message: string;
}
