import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import type { InvoiceItem } from "@/types/invoice";

interface InvoiceLineItemsTableProps {
  items: InvoiceItem[];
}

export function InvoiceLineItemsTable({ items }: InvoiceLineItemsTableProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">Line Items</CardTitle>
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
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Qty</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    Discount
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Tax</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const tax =
                    parseFloat(item.cgstAmount ?? "0") +
                    parseFloat(item.sgstAmount ?? "0") +
                    parseFloat(item.igstAmount ?? "0");
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {item.itemName ?? `Item #${item.itemId}`}
                      </td>
                      <td className="px-3 py-3 text-right">{formatQuantity(item.quantity)}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right">
                        {item.discountPercent && item.discountPercent !== "0"
                          ? `${item.discountPercent}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {tax > 0 ? formatCurrency(tax) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
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
