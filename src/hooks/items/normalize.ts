import { normalizeItemType } from "@/types/item";
import type { Item, StockEntry } from "@/types/item";

export function normalizeItem(item: Item): Item {
  return {
    ...item,
    type: normalizeItemType(item.type),
  };
}

export function normalizeStockEntry(entry: StockEntry): StockEntry {
  return {
    ...entry,
    itemType: entry.itemType ? normalizeItemType(entry.itemType) : entry.itemType,
  };
}
