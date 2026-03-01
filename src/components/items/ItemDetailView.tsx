import { ArrowLeft, History, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { useItem, useItemLedger } from "@/hooks/use-items";
import { formatDate, formatQuantity } from "@/lib/utils";
import { getItemCategoryDisplay, getItemTaxDisplay } from "@/types/item";

export function ItemDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: item, isPending: itemPending } = useItem(id);
  const { data: ledger, isPending: ledgerPending } = useItemLedger(id);
  const isPending = itemPending || ledgerPending;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Items
        </Button>
      </div>

      {isPending ? (
        <TableSkeleton rows={4} />
      ) : !item ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Item not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted or the link is invalid.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>
            Back to Items
          </Button>
        </div>
      ) : (
        <>
          <PageHeader title={item.name} />
          {item.description && (
            <p className="mb-6 text-sm text-muted-foreground">{item.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Stock
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums">{item.currentStock ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </p>
                <p className="mt-2">
                  <Badge variant="secondary" className="font-medium">
                    {item.type}
                  </Badge>
                </p>
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

          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <History className="h-4 w-4 text-muted-foreground" />
                Stock Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!ledger || ledger.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <History className="mb-2 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">No stock movements yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add stock or adjust quantity to see ledger entries.
                  </p>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="w-full text-sm" role="table" aria-label="Stock ledger">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="min-w-[100px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Date
                        </th>
                        <th className="min-w-[90px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Type
                        </th>
                        <th className="min-w-[70px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Qty
                        </th>
                        <th className="min-w-[120px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ledger.map((m) => (
                        <tr key={m.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(m.createdAt)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="secondary" className="text-xs font-medium">
                              {m.movementType}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">
                            {formatQuantity(m.quantity)}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{m.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
