/**
 * Item / stock API path, response normalizers, and imperative fetches used by item hooks.
 * Not React hooks — keep under `lib/` so `hooks/` stays hook-oriented.
 */
import { api } from "@/api";
import { normalizeItemType } from "@/types/item";
import type { Item, StockEntry, StockEntrySource } from "@/types/item";

export const ITEMS_API_BASE = "/items";

/** Min stock is whole units only; API may send decimals like `"10.00"`. */
export function normalizeMinStockThresholdValue(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return t;
  return String(Math.trunc(n));
}

export function normalizeItem(item: Item): Item {
  const ms = item.minStockThreshold;
  return {
    ...item,
    type: normalizeItemType(item.type),
    ...(ms !== undefined ? { minStockThreshold: normalizeMinStockThresholdValue(ms) } : {}),
  };
}

function normalizeEntrySource(raw: unknown): StockEntrySource | undefined {
  if (raw === "PURCHASE_INVOICE" || raw === "ADD_STOCK") return raw;
  return undefined;
}

export function normalizeStockEntry(entry: StockEntry): StockEntry {
  const { entrySource: rawSource, ...rest } = entry;
  const entrySource = rawSource !== undefined ? normalizeEntrySource(rawSource) : undefined;
  return {
    ...rest,
    itemType: entry.itemType ? normalizeItemType(entry.itemType) : entry.itemType,
    ...(entrySource !== undefined ? { entrySource } : {}),
  };
}

export async function getStockEntryById(entryId: number): Promise<StockEntry> {
  const res = await api.get<StockEntry>(`${ITEMS_API_BASE}/stock-entries/${entryId}`);
  return normalizeStockEntry(res.data);
}
