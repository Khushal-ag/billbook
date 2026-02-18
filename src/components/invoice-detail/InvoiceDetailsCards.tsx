import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

interface InvoiceDetailsCardsProps {
  invoice: InvoiceDetail;
}

export function InvoiceDetailsCards({ invoice }: InvoiceDetailsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
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
          {invoice.notes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notes</span>
              <span className="max-w-[200px] text-right">{invoice.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Tax Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sub Total</span>
            <span>{formatCurrency(invoice.subTotal)}</span>
          </div>
          {invoice.discountAmount && invoice.discountAmount !== "0" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.cgstAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST</span>
              <span>{formatCurrency(invoice.cgstAmount)}</span>
            </div>
          )}
          {invoice.sgstAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST</span>
              <span>{formatCurrency(invoice.sgstAmount)}</span>
            </div>
          )}
          {invoice.igstAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGST</span>
              <span>{formatCurrency(invoice.igstAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
