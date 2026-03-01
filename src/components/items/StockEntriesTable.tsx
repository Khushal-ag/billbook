import { Eye, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { StockEntry } from "@/types/item";
import type { Party } from "@/types/party";
import type { Item } from "@/types/item";

interface StockEntriesTableProps {
  entries: StockEntry[];
  items: Item[];
  suppliers: Party[];
  onView: (entryId: number) => void;
  onAdjust?: (itemId: number, itemName: string, stockEntryId?: number) => void;
}

function getItemName(entry: StockEntry, items: Item[]): string {
  if (entry.itemName) return entry.itemName;
  if (entry.item?.name) return entry.item.name;
  const item = items.find((i) => i.id === entry.itemId);
  return item?.name ?? `#${entry.itemId}`;
}

function getSupplierName(entry: StockEntry, suppliers: Party[]): string {
  if (entry.supplierId == null) return "—";
  const party = suppliers.find((p) => p.id === entry.supplierId);
  return party?.name ?? `#${entry.supplierId}`;
}

export function StockEntriesTable({
  entries,
  items,
  suppliers,
  onView,
  onAdjust,
}: StockEntriesTableProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-muted/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        No stock entries yet. Add stock from the &quot;Add Stock&quot; tab.
      </p>
    );
  }

  function formatQty(value: string | number | null | undefined, unit?: string | null): string {
    if (value == null) return "—";
    const s = typeof value === "string" ? value : String(value);
    return unit ? `${s} ${unit}` : s;
  }

  return (
    <div className="data-table-container overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Stock entries list">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Item
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground lg:table-cell"
            >
              Category
            </th>
            <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
              Date
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Purchased
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Adjusted
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Sold
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Actual
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Selling price
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Purchase price
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              Supplier
            </th>
            <th
              scope="col"
              className="w-24 px-3 py-3 text-center font-medium text-muted-foreground"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const itemName = getItemName(entry, items);
            const unit = entry.unit ?? null;
            const purchased =
              entry.quantityPurchased ??
              (typeof entry.quantity === "string" ? entry.quantity : String(entry.quantity));
            const adjusted = entry.quantityAdjusted ?? "0";
            const sold = entry.quantitySold ?? "0";
            const actual = entry.actualQuantity ?? entry.quantity;
            const actualStr = typeof actual === "string" ? actual : String(actual);
            return (
              <tr
                key={entry.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/20"
                role="button"
                tabIndex={0}
                onClick={() => onView(entry.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onView(entry.id)}
              >
                <td className="px-4 py-3 font-medium sm:px-6">
                  {itemName}
                  {unit && <span className="ml-1 font-normal text-muted-foreground">({unit})</span>}
                </td>
                <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                  {entry.categoryName ?? "—"}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {formatDate(entry.purchaseDate)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {formatQty(purchased, unit)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {formatQty(adjusted, unit)}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {formatQty(sold, unit)}
                </td>
                <td className="px-3 py-3 text-right font-mono font-medium tabular-nums">
                  {formatQty(actualStr, unit)}
                </td>
                <td className="px-3 py-3 text-right">
                  {entry.sellingPrice != null && entry.sellingPrice !== ""
                    ? formatCurrency(entry.sellingPrice)
                    : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {entry.purchasePrice != null && entry.purchasePrice !== ""
                    ? formatCurrency(entry.purchasePrice)
                    : "—"}
                </td>
                <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                  {getSupplierName(entry, suppliers)}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(entry.id);
                      }}
                      title="View details"
                      aria-label={`View stock entry ${entry.id}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {onAdjust && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdjust(entry.itemId, itemName, entry.id);
                        }}
                        title="Adjust stock for this batch"
                        aria-label={`Adjust stock for ${itemName}`}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
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
  );
}
