import { ArrowLeft, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { useProduct, useStockLedger } from "@/hooks/use-products";
import { useResourceAuditLogs } from "@/hooks/use-audit-logs";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProductDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: product, isPending: productPending } = useProduct(id);
  const { data: ledger, isPending: ledgerPending } = useStockLedger(id);
  const { data: auditData } = useResourceAuditLogs("PRODUCT", id);
  const isPending = productPending || ledgerPending;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </button>
      </div>

      {isPending ? (
        <TableSkeleton rows={4} />
      ) : !product ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Product not found.</p>
      ) : (
        <>
          <PageHeader
            title={product.name}
            description={`${product.type} — Unit: ${product.unit || "—"}`}
          />

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Current Stock</p>
                <p className="mt-1 text-lg font-semibold">{product.currentStock}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.sellingPrice ?? "0")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Purchase Price</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.purchasePrice ?? "0")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">HSN/SAC</p>
                <p className="mt-1 text-lg font-semibold">
                  {product.hsnCode || product.sacCode || "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock Ledger
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!ledger || ledger.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No stock movements yet.
                </p>
              ) : (
                <div className="data-table-container">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Type
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((m) => (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary" className="text-xs">
                              {m.movementType}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{m.quantity}</td>
                          <td className="px-3 py-2 text-muted-foreground">{m.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {auditData?.logs && auditData.logs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <History className="h-4 w-4" />
                  Audit History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.logs.map((log) => (
                    <div key={log.id} className="flex justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={log.action === "DELETE" ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        {log.actorRole && (
                          <p className="text-xs text-muted-foreground">By {log.actorRole}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
