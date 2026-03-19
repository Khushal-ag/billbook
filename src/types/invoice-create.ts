import type { Item, StockEntry } from "@/types/item";

export interface InvoiceLineDraft {
  id: string;
  item: Item | null;
  stockEntryId: number | null;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  discountAmount: string;
  cgstRate: string;
  sgstRate: string;
  igstRate: string;
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
