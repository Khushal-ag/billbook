import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatStockQuantity, formatDate, cn } from "@/lib/utils";
import { StockEntrySourceBadge } from "@/components/items/StockEntrySourceBadge";
import { stockEntrySheetSubtitle, stockQuantityTooltips } from "@/lib/stock-entry-labels";
import { useStockEntry } from "@/hooks/use-items";
import { Package, Calendar, Scale, DollarSign, Building2, Layers, Wrench } from "lucide-react";
import Link from "next/link";
import { isServiceType } from "@/types/item";
import type { Item, StockEntry } from "@/types/item";

interface StockEntryDetailSheetProps {
  entryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName?: string | null;
  /** Used to detect SERVICE items and hide purchase-only fields */
  items?: Item[];
}

const labelClass = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
const valueClass = "mt-1.5 text-sm font-medium text-foreground";

/** Single-entry GET often sends `itemName` without a nested `item` object (same as list API). */
function stockEntryItemDisplayName(entry: StockEntry, items: Item[]): string {
  const fromEntry = entry.itemName?.trim() || entry.item?.name?.trim();
  if (fromEntry) return fromEntry;
  const fromCatalog = items.find((i) => i.id === entry.itemId)?.name?.trim();
  return fromCatalog || "Unnamed item";
}

export function StockEntryDetailSheet({
  entryId,
  open,
  onOpenChange,
  supplierName,
  items = [],
}: StockEntryDetailSheetProps) {
  const {
    data: entry,
    isPending,
    error,
  } = useStockEntry(open ? (entryId ?? undefined) : undefined);
  const isService = entry
    ? isServiceType(entry.itemType) || isServiceType(items.find((i) => i.id === entry.itemId)?.type)
    : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              {isService ? (
                <Wrench className="h-4 w-4 text-primary" />
              ) : (
                <Package className="h-4 w-4 text-primary" />
              )}
            </div>
            {isService ? "Service Entry" : "Stock Entry"}
          </SheetTitle>
          <SheetDescription>
            {entry ? stockEntrySheetSubtitle(entry, isService) : "View entry details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-16 w-2/3 rounded-lg" />
            </div>
          )}

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4">
                <p className="text-sm font-medium text-destructive">
                  Failed to load stock entry details.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check your connection and try again.
                </p>
              </CardContent>
            </Card>
          )}

          {!isPending && !error && entry && (
            <>
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={labelClass}>{isService ? "Item" : "Item & batch"}</span>
                  </div>
                  <div>
                    <p className={labelClass}>Item</p>
                    <p className={valueClass}>
                      <Link
                        href={`/items/${entry.itemId}`}
                        className="text-primary hover:underline"
                      >
                        {stockEntryItemDisplayName(entry, items)}
                      </Link>
                      {entry.unit && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          ({entry.unit})
                        </span>
                      )}
                    </p>
                  </div>
                  {entry.categoryName && (
                    <div>
                      <p className={labelClass}>Category</p>
                      <p className={valueClass}>{entry.categoryName}</p>
                    </div>
                  )}
                  {!isService && (
                    <div>
                      <p className={labelClass}>Source</p>
                      <p className={`${valueClass} flex flex-wrap items-center gap-2`}>
                        <StockEntrySourceBadge entrySource={entry.entrySource} />
                      </p>
                    </div>
                  )}
                  <div>
                    <p className={labelClass}>{isService ? "Date" : "Purchase date"}</p>
                    <p className={`${valueClass} flex items-center gap-1.5`}>
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(entry.purchaseDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <Scale className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={labelClass} title={stockQuantityTooltips.onHand}>
                      On hand
                    </span>
                  </div>
                  <div>
                    <p
                      className="text-2xl font-semibold tabular-nums text-foreground"
                      title={stockQuantityTooltips.onHand}
                    >
                      {formatStockQuantity(entry.actualQuantity ?? entry.quantity)}
                      {entry.unit && (
                        <span className="ml-1 text-base font-normal text-muted-foreground">
                          {entry.unit}
                        </span>
                      )}
                    </p>
                    {!isService &&
                      (entry.quantityPurchased != null ||
                        entry.quantityAdjusted != null ||
                        entry.quantitySold != null) && (
                        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          {entry.quantityPurchased != null && (
                            <span>Purchased {formatStockQuantity(entry.quantityPurchased)}</span>
                          )}
                          {entry.quantityAdjusted != null && entry.quantityAdjusted !== "0" && (
                            <span>· Adjusted {formatStockQuantity(entry.quantityAdjusted)}</span>
                          )}
                          {entry.quantitySold != null && entry.quantitySold !== "0" && (
                            <span title={stockQuantityTooltips.netOut}>
                              · Net out {formatStockQuantity(entry.quantitySold)}
                            </span>
                          )}
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={labelClass}>{isService ? "Rate & amount" : "Pricing"}</span>
                  </div>
                  <div className={isService ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                    <div>
                      <p className={labelClass}>{isService ? "Rate" : "Selling price"}</p>
                      <p className={valueClass}>
                        {entry.sellingPrice != null && entry.sellingPrice !== ""
                          ? formatCurrency(entry.sellingPrice)
                          : "—"}
                      </p>
                    </div>
                    {isService && entry.sellingPrice != null && entry.sellingPrice !== "" && (
                      <div>
                        <p className={labelClass}>Amount</p>
                        <p className="text-lg font-semibold tabular-nums text-foreground">
                          {formatCurrency(
                            Number(entry.actualQuantity ?? entry.quantity) *
                              Number(entry.sellingPrice),
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatStockQuantity(entry.actualQuantity ?? entry.quantity)} ×{" "}
                          {formatCurrency(entry.sellingPrice)}
                        </p>
                      </div>
                    )}
                    {!isService && (
                      <div>
                        <p className={labelClass}>Purchase price</p>
                        <p className={valueClass}>
                          {entry.purchasePrice != null && entry.purchasePrice !== ""
                            ? formatCurrency(entry.purchasePrice)
                            : "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {(entry.supplierId != null || entry.supplierName || supplierName) && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className={labelClass}>Vendor</span>
                    </div>
                    <p
                      className={cn(
                        valueClass,
                        entry.supplierIsActive === false && "text-destructive",
                      )}
                    >
                      {entry.supplierName ??
                        supplierName ??
                        (entry.supplierId != null ? "Unknown vendor" : "—")}
                    </p>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-muted-foreground">
                Created {formatDate(entry.createdAt)}
                {entry.updatedAt !== entry.createdAt && (
                  <> · Updated {formatDate(entry.updatedAt)}</>
                )}
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
