import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { useStockEntry } from "@/hooks/use-items";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";

interface StockEntryDetailSheetProps {
  entryId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName?: string | null;
}

export function StockEntryDetailSheet({
  entryId,
  open,
  onOpenChange,
  supplierName,
}: StockEntryDetailSheetProps) {
  const {
    data: entry,
    isPending,
    error,
  } = useStockEntry(open ? (entryId ?? undefined) : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Stock Entry
          </SheetTitle>
          <SheetDescription>
            {entry
              ? `Batch details · ${typeof entry.quantity === "string" ? entry.quantity : entry.quantity} units`
              : "View stock entry details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {error && <p className="text-sm text-destructive">Failed to load stock entry details.</p>}

          {!isPending && !error && entry && (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Item
                </dt>
                <dd className="mt-1 font-medium">
                  <Link to={`/items/${entry.itemId}`} className="text-primary hover:underline">
                    {entry.item?.name ?? `Item #${entry.itemId}`}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Purchase date
                </dt>
                <dd className="mt-1">{formatDate(entry.purchaseDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quantity
                </dt>
                <dd className="mt-1 font-mono tabular-nums">
                  {typeof entry.quantity === "string" ? entry.quantity : entry.quantity}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Selling price
                </dt>
                <dd className="mt-1">
                  {entry.sellingPrice != null && entry.sellingPrice !== ""
                    ? formatCurrency(entry.sellingPrice)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Purchase price
                </dt>
                <dd className="mt-1">
                  {entry.purchasePrice != null && entry.purchasePrice !== ""
                    ? formatCurrency(entry.purchasePrice)
                    : "—"}
                </dd>
              </div>
              {(entry.supplierId != null || supplierName) && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Supplier
                  </dt>
                  <dd className="mt-1">
                    {supplierName ?? (entry.supplierId != null ? `#${entry.supplierId}` : "—")}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1 text-muted-foreground">{formatDate(entry.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Updated
                </dt>
                <dd className="mt-1 text-muted-foreground">{formatDate(entry.updatedAt)}</dd>
              </div>
            </dl>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
