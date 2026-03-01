import { Eye, SlidersHorizontal, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatQuantity, formatDate, cn } from "@/lib/utils";
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

const thClass = "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const thRight = thClass + " text-right";
const tdClass = "px-4 py-3 align-middle";
const tdRight = tdClass + " text-right tabular-nums";

export function StockEntriesTable({
  entries,
  items,
  suppliers,
  onView,
  onAdjust,
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
        <table className="w-full text-sm" role="table" aria-label="Stock by batch">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className={cn(thClass, "min-w-[160px] text-left")}>Item</th>
              <th className={cn(thClass, "hidden min-w-[100px] text-left lg:table-cell")}>
                Category
              </th>
              <th className={cn(thClass, "min-w-[100px] text-left")}>Date</th>
              <th className={cn(thRight, "min-w-[72px]")}>Purchased</th>
              <th className={cn(thRight, "min-w-[72px]")}>Adjusted</th>
              <th className={cn(thRight, "min-w-[72px]")}>Sold</th>
              <th className={cn(thRight, "min-w-[80px]")}>Actual</th>
              <th className={cn(thRight, "min-w-[88px]")}>Selling</th>
              <th className={cn(thRight, "min-w-[88px]")}>Purchase</th>
              <th className={cn(thClass, "hidden min-w-[120px] text-left md:table-cell")}>
                Supplier
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
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
                  className={cn(
                    "cursor-pointer border-b border-border/80 transition-colors hover:bg-muted/30",
                    i % 2 === 1 && "bg-muted/10",
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={() => onView(entry.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onView(entry.id)}
                >
                  <td className={cn(tdClass, "text-left font-medium")}>
                    {itemName}
                    {unit && (
                      <span className="ml-1.5 font-normal text-muted-foreground">({unit})</span>
                    )}
                  </td>
                  <td
                    className={cn(tdClass, "hidden text-left text-muted-foreground lg:table-cell")}
                  >
                    {entry.categoryName ?? "—"}
                  </td>
                  <td className={cn(tdClass, "text-left text-muted-foreground")}>
                    {formatDate(entry.purchaseDate)}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {formatQuantity(purchased)}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>
                    {formatQuantity(adjusted)}
                  </td>
                  <td className={cn(tdRight, "text-muted-foreground")}>{formatQuantity(sold)}</td>
                  <td className={cn(tdRight, "font-semibold")}>{formatQuantity(actualStr)}</td>
                  <td className={tdRight}>
                    {entry.sellingPrice != null && entry.sellingPrice !== ""
                      ? formatCurrency(entry.sellingPrice)
                      : "—"}
                  </td>
                  <td className={tdRight}>
                    {entry.purchasePrice != null && entry.purchasePrice !== ""
                      ? formatCurrency(entry.purchasePrice)
                      : "—"}
                  </td>
                  <td
                    className={cn(tdClass, "hidden text-left text-muted-foreground md:table-cell")}
                  >
                    {getSupplierName(entry, suppliers)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(entry.id);
                        }}
                        title="View details"
                        aria-label={`View entry ${entry.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {onAdjust && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAdjust(entry.itemId, itemName, entry.id);
                          }}
                          title="Adjust this batch"
                          aria-label={`Adjust ${itemName}`}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
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
