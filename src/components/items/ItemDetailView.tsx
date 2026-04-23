"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { History, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { PageBackLink } from "@/components/PageBackLink";
import ItemDetailSkeleton from "@/components/skeletons/ItemDetailSkeleton";
import { useItem, useItemLedger } from "@/hooks/use-items";
import { cn, formatDate, formatStockQuantity } from "@/lib/core/utils";
import {
  type LedgerMovementType,
  getItemCategoryDisplay,
  getItemTaxDisplay,
  isServiceType,
} from "@/types/item";
import { usePermissions } from "@/hooks/use-permissions";
import { PAGE } from "@/constants/page-access";

function stockMovementLabel(type: LedgerMovementType): string {
  switch (type) {
    case "PURCHASE":
      return "Purchase";
    case "SALE":
      return "Sale";
    case "ADJUSTMENT":
      return "Adjustment";
    default:
      return type;
  }
}

function stockMovementBadgeVariant(
  type: LedgerMovementType,
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "PURCHASE":
      return "default";
    case "SALE":
      return "secondary";
    case "ADJUSTMENT":
      return "outline";
    default:
      return "secondary";
  }
}

export function ItemDetailView({ id }: { id: number }) {
  const { can } = usePermissions();
  const canStockLedger = can(PAGE.stock_ledger);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { backHref, backLabel } = useMemo(() => {
    const from = searchParams.get("from");
    if (from === "stock") {
      return { backHref: "/stock" as const, backLabel: "Back to Stock" };
    }
    return { backHref: "/items" as const, backLabel: "Back to Items" };
  }, [searchParams]);

  const { data: item, isPending: itemPending } = useItem(id);
  const ledgerItemId = item != null && !isServiceType(item.type) && canStockLedger ? id : undefined;
  const { data: ledger, isPending: ledgerPending } = useItemLedger(ledgerItemId);
  const isPending = itemPending || (ledgerItemId != null && ledgerPending);

  useEffect(() => {
    if (isPending || !item || isServiceType(item.type) || !canStockLedger) return;
    if (typeof window === "undefined" || window.location.hash !== "#stock-ledger") return;
    const raf = window.requestAnimationFrame(() => {
      document
        .getElementById("stock-ledger")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isPending, item, canStockLedger]);

  return (
    <div className="page-container animate-fade-in">
      <PageBackLink href={backHref}>{backLabel}</PageBackLink>

      {isPending ? (
        <ItemDetailSkeleton />
      ) : !item ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Item not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted or the link is invalid.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push(backHref)}
          >
            {backLabel}
          </Button>
        </div>
      ) : (
        <>
          <PageHeader title={item.name} />
          {item.description && (
            <p className="mb-6 text-sm text-muted-foreground">{item.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Stock
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums">
                  {formatStockQuantity(item.currentStock ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="font-medium">
                    {item.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </p>
                <p className="mt-2 font-medium text-foreground">{getItemCategoryDisplay(item)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Unit
                </p>
                <p className="mt-2 font-medium text-foreground">{item.unit || "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  HSN / SAC
                </p>
                <p className="mt-2 font-mono text-sm font-medium text-foreground">
                  {item.hsnCode || item.sacCode || "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {getItemTaxDisplay(item)}
                </p>
              </CardContent>
            </Card>
          </div>

          {!isServiceType(item.type) && canStockLedger && (
            <Card id="stock-ledger" className="scroll-mt-24">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Stock Ledger
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!ledger || ledger.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-12">
                    <History className="mb-2 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">No stock movements yet</p>
                    <p className="mt-1 text-center text-sm text-muted-foreground">
                      Add stock or adjust quantity to see ledger entries.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border-t border-border">
                    <table
                      className="w-full min-w-[480px] text-sm"
                      role="table"
                      aria-label="Stock ledger"
                    >
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Date
                          </th>
                          <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                            Type
                          </th>
                          <th className="whitespace-nowrap py-3 pl-3 pr-8 text-right text-xs font-semibold uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="min-w-[140px] py-3 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...ledger]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                          )
                          .map((m) => (
                            <tr key={m.id} className="transition-colors hover:bg-muted/30">
                              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                {formatDate(m.createdAt)}
                              </td>
                              <td className="px-3 py-3">
                                <Badge
                                  variant={stockMovementBadgeVariant(m.movementType)}
                                  className="text-xs font-medium"
                                >
                                  {stockMovementLabel(m.movementType)}
                                </Badge>
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap py-3 pl-3 pr-8 text-right font-medium tabular-nums",
                                  m.quantity > 0 && "text-emerald-600 dark:text-emerald-400",
                                  m.quantity < 0 && "text-destructive",
                                )}
                              >
                                {m.quantity > 0
                                  ? `+${formatStockQuantity(m.quantity)}`
                                  : formatStockQuantity(m.quantity)}
                              </td>
                              <td
                                className="max-w-[220px] py-3 pl-6 pr-4 text-muted-foreground sm:max-w-[280px]"
                                title={m.notes?.trim() || undefined}
                              >
                                <span className="line-clamp-2 break-words">
                                  {m.notes?.trim() ? m.notes : "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
