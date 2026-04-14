import { getEntryDateIso } from "@/lib/invoice-create";
import { formatISODateDisplay } from "@/lib/date";
import { formatDate, formatStockQuantity } from "@/lib/utils";
import type { StockEntry, StockEntrySource } from "@/types/item";

/** Column / field tooltips for stock tables */
export const stockQuantityTooltips = {
  /** actualQuantity */
  onHand: "How many units of this batch you have available right now.",
  /** quantitySold */
  netOut:
    "Total units that have left this batch (sales, returns to supplier, and similar), after purchases and adjustments.",
} as const;

/** Table / compact display */
export function stockEntrySourceShortLabel(
  entrySource: StockEntrySource | null | undefined,
): string {
  if (entrySource === "PURCHASE_INVOICE") return "Purchase invoice";
  if (entrySource === "ADD_STOCK") return "Manual add";
  return "Manual add";
}

/** Detail sheet / tooltips */
export function stockEntrySourceFullLabel(
  entrySource: StockEntrySource | null | undefined,
): string {
  if (entrySource === "PURCHASE_INVOICE")
    return "Created from a finalized purchase invoice (batch linked to that bill).";
  if (entrySource === "ADD_STOCK") return "Added manually (Add Stock or adjustment).";
  return "Added manually (Add Stock or adjustment).";
}

/** Batch picker rows: purchase date and on-hand qty (no internal ids). */
export function stockBatchSelectLabel(entry: StockEntry): string {
  const date = formatISODateDisplay(getEntryDateIso(entry)) || "No date";
  const raw =
    entry.actualQuantity ??
    (typeof entry.quantity === "string" ? entry.quantity : String(entry.quantity ?? ""));
  return `${date} · ${formatStockQuantity(raw)} on hand`;
}

/** Detail sheet description under the title (no entry ids). */
export function stockEntrySheetSubtitle(entry: StockEntry, isService: boolean): string {
  const qty = formatStockQuantity(entry.actualQuantity ?? entry.quantity);
  const unit = entry.unit ? ` ${entry.unit}` : "";
  if (isService) {
    return `${qty}${unit}`;
  }
  return `On hand ${qty}${unit} · ${formatDate(entry.purchaseDate)}`;
}
