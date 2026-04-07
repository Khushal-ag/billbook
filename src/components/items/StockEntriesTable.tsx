import Link from "next/link";
import { History, SlidersHorizontal, Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateCompact, formatStockQuantity, cn } from "@/lib/utils";
import {
  STOCK_TABLE_OUTBOUND_COLUMN_TITLE,
  stockTableThClass,
  stockTableThRight,
  stockTableTdClass,
  stockTableTdRight,
  formatStockAdjustmentDelta,
} from "@/lib/stock-table-display";
import { StockEntrySourceBadge } from "@/components/items/StockEntrySourceBadge";
import type { StockEntry } from "@/types/item";
import type { Item } from "@/types/item";
import { isServiceType } from "@/types/item";

interface StockEntriesTableProps {
  entries: StockEntry[];
  items: Item[];
  onView: (entryId: number) => void;
  onAdjust?: (itemId: number, itemName: string, stockEntryId?: number) => void;
  onEditEntry?: (entry: StockEntry) => void;
}

function getItemName(entry: StockEntry, items: Item[]): string {
  if (entry.itemName) return entry.itemName;
  if (entry.item?.name) return entry.item.name;
  const item = items.find((i) => i.id === entry.itemId);
  return item?.name ?? "Unnamed item";
}

function getSupplierDisplay(entry: StockEntry): {
  label: string;
  isInactive: boolean;
} {
  if (entry.supplierId == null) return { label: "—", isInactive: false };
  if (entry.supplierName) {
    return { label: entry.supplierName, isInactive: entry.supplierIsActive === false };
  }
  return { label: "Unknown vendor", isInactive: false };
}

export function StockEntriesTable({
  entries,
  items,
  onView,
  onAdjust,
  onEditEntry,
}: StockEntriesTableProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No stock entries yet</p>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Add stock from the Add Stock tab. Each batch will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm" role="table" aria-label="Stock by batch">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={cn(stockTableThClass, "min-w-[120px] px-3 text-left sm:px-4")}>
                Item
              </th>
              <th className={cn(stockTableThClass, "min-w-[120px] text-left")}>Source</th>
              <th className={cn(stockTableThClass, "min-w-[140px] text-left")}>Vendor/Category</th>
              <th className={cn(stockTableThClass, "min-w-[88px] text-left")}>Date</th>
              <th
                className={cn(stockTableThRight, "hidden min-w-[72px] md:table-cell")}
                title="Original purchase quantity for this batch (not current on-hand stock)"
              >
                Purchased qty
              </th>
              <th className={cn(stockTableThRight, "hidden min-w-[72px] md:table-cell")}>
                Adjusted
              </th>
              <th
                className={cn(stockTableThRight, "hidden min-w-[88px] md:table-cell")}
                title={STOCK_TABLE_OUTBOUND_COLUMN_TITLE}
              >
                Outbound
              </th>
              <th
                className={cn(stockTableThRight, "min-w-[72px]")}
                title="On-hand quantity for this batch (ledger / actualQuantity)"
              >
                On hand
              </th>
              <th className={cn(stockTableThRight, "min-w-[80px]")}>Selling Price</th>
              <th className={cn(stockTableThRight, "hidden min-w-[88px] sm:table-cell")}>
                Purchase Price
              </th>
              <th className={cn(stockTableThClass, "min-w-[132px] text-center")}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const itemName = getItemName(entry, items);
              const unit = entry.unit ?? null;
              const item = items.find((it) => it.id === entry.itemId);
              const isService = isServiceType(entry.itemType) || isServiceType(item?.type);
              const purchased =
                entry.quantityPurchased ??
                (typeof entry.quantity === "string" ? entry.quantity : String(entry.quantity));
              const adjusted = entry.quantityAdjusted ?? "0";
              const adjustedValue = Number(adjusted);
              const adjustedTextClass = !Number.isFinite(adjustedValue)
                ? "text-muted-foreground"
                : adjustedValue < 0
                  ? "text-destructive"
                  : adjustedValue > 0
                    ? "text-emerald-600"
                    : "text-foreground";
              const sold = entry.quantitySold ?? "0";
              const actual = entry.actualQuantity ?? entry.quantity;
              const actualStr = typeof actual === "string" ? actual : String(actual);
              const vendor = getSupplierDisplay(entry);
              const category = entry.categoryName?.trim();
              return (
                <tr
                  key={entry.id}
                  className={cn(
                    "cursor-pointer border-b border-border/80 transition-colors hover:bg-muted/30",
                    i % 2 === 1 && "bg-muted/10",
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={() => onView(entry.id)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onView(entry.id);
                    }
                  }}
                >
                  <td className={cn(stockTableTdClass, "px-3 text-left font-medium sm:px-4")}>
                    {itemName}
                    {unit && (
                      <span className="ml-1.5 font-normal text-muted-foreground">({unit})</span>
                    )}
                  </td>
                  <td className={cn(stockTableTdClass, "whitespace-nowrap text-left")}>
                    {isService ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <StockEntrySourceBadge entrySource={entry.entrySource} />
                    )}
                  </td>
                  <td className={cn(stockTableTdClass, "whitespace-nowrap text-left")}>
                    <span className={cn(vendor.isInactive && "font-medium text-destructive")}>
                      {vendor.label}
                    </span>
                    {category ? <span className="text-muted-foreground"> ({category})</span> : null}
                  </td>
                  <td
                    className={cn(
                      stockTableTdClass,
                      "whitespace-nowrap text-left text-muted-foreground",
                    )}
                  >
                    {isService ? "—" : formatDateCompact(entry.purchaseDate)}
                  </td>
                  <td
                    className={cn(stockTableTdRight, "hidden text-muted-foreground md:table-cell")}
                  >
                    {isService ? "—" : formatStockQuantity(purchased)}
                  </td>
                  <td
                    className={cn(
                      stockTableTdRight,
                      "hidden md:table-cell",
                      isService ? "text-muted-foreground" : adjustedTextClass,
                    )}
                  >
                    {isService ? "—" : formatStockAdjustmentDelta(adjusted)}
                  </td>
                  <td
                    className={cn(stockTableTdRight, "hidden text-muted-foreground md:table-cell")}
                  >
                    {isService ? "—" : formatStockQuantity(sold)}
                  </td>
                  <td className={cn(stockTableTdRight, "font-semibold")}>
                    {isService ? "—" : formatStockQuantity(actualStr)}
                  </td>
                  <td className={stockTableTdRight}>
                    {entry.sellingPrice != null && entry.sellingPrice !== ""
                      ? formatCurrency(entry.sellingPrice)
                      : "—"}
                  </td>
                  <td className={cn(stockTableTdRight, "hidden sm:table-cell")}>
                    {isService
                      ? "—"
                      : entry.purchasePrice != null && entry.purchasePrice !== ""
                        ? formatCurrency(entry.purchasePrice)
                        : "—"}
                  </td>
                  <td className={cn(stockTableTdClass, "w-[132px] text-left")}>
                    <div className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap">
                      {!isService ? (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <Link
                            href={`/items/${entry.itemId}?from=stock#stock-ledger`}
                            onClick={(e) => e.stopPropagation()}
                            title="Stock ledger"
                            aria-label={`Stock ledger for ${itemName}`}
                          >
                            <History className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <div className="h-8 w-8" aria-hidden />
                      )}
                      {onAdjust && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isService}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isService) return;
                            onAdjust(entry.itemId, itemName, entry.id);
                          }}
                          title={
                            isService ? "Not available for service items" : "Adjust this batch"
                          }
                          aria-label={`Adjust ${itemName}`}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditEntry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEntry(entry);
                          }}
                          title="Edit stock entry"
                          aria-label={`Edit ${itemName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
