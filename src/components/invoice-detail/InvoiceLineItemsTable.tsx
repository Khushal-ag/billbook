import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/core/utils";
import type { InvoiceItem, InvoiceType } from "@/types/invoice";

interface InvoiceLineItemsTableProps {
  items: InvoiceItem[];
  purchaseDateByStockEntryId?: Record<number, string | undefined>;
  /** When set, show purchase/selling columns and line GST for vendor bills. */
  invoiceType?: InvoiceType;
}

function parseLineMoney(value: string | null | undefined): number {
  const n = parseFloat(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatGstSlab(item: InvoiceItem): string {
  const cgst = parseLineMoney(item.cgstRate ?? undefined);
  const sgst = parseLineMoney(item.sgstRate ?? undefined);
  const igst = parseLineMoney(item.igstRate ?? undefined);
  if (cgst > 0 || sgst > 0) {
    if (cgst > 0 && sgst > 0) return `${cgst}%+${sgst}%`;
    return `${cgst || sgst}%`;
  }
  if (igst > 0) return `IGST ${igst}%`;
  return "—";
}

export function InvoiceLineItemsTable({
  items,
  purchaseDateByStockEntryId = {},
  invoiceType,
}: InvoiceLineItemsTableProps) {
  const totalLineAmount = items.reduce((sum, item) => sum + parseLineMoney(item.lineTotal), 0);
  const isPurchaseBill = invoiceType === "PURCHASE_INVOICE" || invoiceType === "PURCHASE_RETURN";
  const showSellingPriceColumn = invoiceType === "PURCHASE_INVOICE";

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
                    {isPurchaseBill ? "Purchase ₹" : "Unit price"}
                  </th>
                  {showSellingPriceColumn ? (
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                      Selling ₹
                    </th>
                  ) : null}
                  {isPurchaseBill ? (
                    <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                      GST %
                    </th>
                  ) : null}
                  <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground sm:table-cell">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const hsn = item.hsnCode || item.sacCode;
                  const sid = item.stockEntryId;
                  const purchaseDate =
                    sid != null && Number.isFinite(sid)
                      ? (purchaseDateByStockEntryId[sid] ?? item.createdAt)
                      : null;
                  const displayName = item.itemName?.trim() || "Unnamed item";
                  return (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{displayName}</div>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">{hsn || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {purchaseDate ? (
                          <div>
                            <div>{formatDate(purchaseDate)}</div>
                            {sid != null ? (
                              <div className="mt-0.5 text-xs text-muted-foreground/85">
                                Inventory batch
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      {showSellingPriceColumn ? (
                        <td className="px-3 py-3 text-right tabular-nums text-foreground">
                          {item.sellingPrice != null && String(item.sellingPrice).trim() !== ""
                            ? formatCurrency(item.sellingPrice)
                            : "—"}
                        </td>
                      ) : null}
                      {isPurchaseBill ? (
                        <td className="hidden px-3 py-3 text-right text-xs tabular-nums text-muted-foreground lg:table-cell">
                          {formatGstSlab(item)}
                        </td>
                      ) : null}
                      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">
                        {item.discountPercent && item.discountPercent !== "0"
                          ? `${item.discountPercent}%`
                          : item.discountAmount && item.discountAmount !== "0"
                            ? formatCurrency(item.discountAmount)
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/40 font-semibold text-foreground">
                  <td
                    colSpan={isPurchaseBill ? 8 : 6}
                    className="whitespace-nowrap px-4 py-3 pl-4 text-left"
                  >
                    Total
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                    {formatCurrency(totalLineAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
