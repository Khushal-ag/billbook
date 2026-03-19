import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INVOICE_TYPE_OPTIONS } from "@/lib/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

interface InvoiceDetailsCardsProps {
  invoice: InvoiceDetail;
}

export function InvoiceDetailsCards({ invoice }: InvoiceDetailsCardsProps) {
  const typeLabel =
    INVOICE_TYPE_OPTIONS.find((o) => o.type === invoice.invoiceType)?.label ?? invoice.invoiceType;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice Type</span>
            <span className="font-medium">{typeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice Date</span>
            <span>{formatDate(invoice.invoiceDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date</span>
            <span>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Financial Year</span>
            <span>{invoice.financialYear ?? "—"}</span>
          </div>
          {invoice.partyName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Party</span>
              <span className="font-medium">{invoice.partyName}</span>
            </div>
          )}
          {invoice.notes && (
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Notes</span>
              <span className="text-right text-muted-foreground">{invoice.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Financial Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sub Total</span>
            <span className="tabular-nums">{formatCurrency(invoice.subTotal)}</span>
          </div>
          {invoice.discountAmount && invoice.discountAmount !== "0" && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="tabular-nums">−{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.cgstAmount && parseFloat(invoice.cgstAmount) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST</span>
              <span className="tabular-nums">{formatCurrency(invoice.cgstAmount)}</span>
            </div>
          )}
          {invoice.sgstAmount && parseFloat(invoice.sgstAmount) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST</span>
              <span className="tabular-nums">{formatCurrency(invoice.sgstAmount)}</span>
            </div>
          )}
          {invoice.igstAmount && parseFloat(invoice.igstAmount) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGST</span>
              <span className="tabular-nums">{formatCurrency(invoice.igstAmount)}</span>
            </div>
          )}
          {invoice.totalTax && parseFloat(invoice.totalTax) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Tax</span>
              <span className="tabular-nums">{formatCurrency(invoice.totalTax)}</span>
            </div>
          )}
          {invoice.roundOffAmount && invoice.roundOffAmount !== "0" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round Off</span>
              <span className="tabular-nums">{formatCurrency(invoice.roundOffAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Grand Total</span>
            <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
