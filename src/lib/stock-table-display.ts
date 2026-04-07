import { formatStockQuantity } from "@/lib/utils";

/** Tooltip / title for the net outbound quantity column (sales + returns to supplier). */
export const STOCK_TABLE_OUTBOUND_COLUMN_TITLE =
  "Sold and returned to supplier (combined outbound)" as const;

export const stockTableThClass =
  "px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground";
export const stockTableThRight = stockTableThClass + " text-right";
export const stockTableTdClass = "px-3 py-2.5 align-middle";
export const stockTableTdRight = stockTableTdClass + " text-right tabular-nums";

export function formatStockQtyOrDash(value: string | null | undefined): string {
  return value != null && value !== "" ? formatStockQuantity(value) : "—";
}

/** Ledger adjustment column: rounded whole units with + prefix for positive deltas. */
export function formatStockAdjustmentDelta(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  const rounded = Math.round(numeric);
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : String(rounded);
}
