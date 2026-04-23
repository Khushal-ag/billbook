import { Badge } from "@/components/ui/badge";
import {
  stockEntrySourceFullLabel,
  stockEntrySourceShortLabel,
} from "@/lib/items/stock-entry-labels";
import type { StockEntrySource } from "@/types/item";

type Props = {
  entrySource: StockEntrySource | null | undefined;
  className?: string;
};

/** Consistent pill for how a batch was created (table + detail). */
export function StockEntrySourceBadge({ entrySource, className }: Props) {
  const isPurchase = entrySource === "PURCHASE_INVOICE";
  return (
    <Badge
      variant={isPurchase ? "secondary" : "outline"}
      className={className ?? "max-w-full shrink-0 truncate font-normal"}
      title={stockEntrySourceFullLabel(entrySource)}
    >
      {stockEntrySourceShortLabel(entrySource)}
    </Badge>
  );
}
