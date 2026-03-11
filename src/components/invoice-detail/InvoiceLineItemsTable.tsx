import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/utils";
import type { InvoiceItem } from "@/types/invoice";

interface InvoiceLineItemsTableProps {
  items: InvoiceItem[];
  purchaseDateByStockEntryId?: Record<number, string | undefined>;
}

export function InvoiceLineItemsTable({
  items,
  purchaseDateByStockEntryId = {},
}: InvoiceLineItemsTableProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">Items</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No items.</p>
        ) : (
          <div className="data-table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    HSN Code
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    Purchase Date
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Qty</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground sm:table-cell">
                    Discount
                  </th>
                  <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground sm:table-cell">
                    Tax
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Net Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const tax =
                    parseFloat(item.cgstAmount ?? "0") +
                    parseFloat(item.sgstAmount ?? "0") +
                    parseFloat(item.igstAmount ?? "0");
                  const hsn = item.hsnCode || item.sacCode;
                  const purchaseDate =
                    purchaseDateByStockEntryId[item.stockEntryId] ?? item.createdAt;
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.itemName ?? `Item #${item.itemId}`}</div>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">{hsn || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {formatDate(purchaseDate)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">
                        {item.discountPercent && item.discountPercent !== "0"
                          ? `${item.discountPercent}%`
                          : "—"}
                      </td>
                      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">
                        {tax > 0 ? formatCurrency(tax) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
