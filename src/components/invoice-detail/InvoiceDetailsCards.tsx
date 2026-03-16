import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

interface InvoiceDetailsCardsProps {
  invoice: InvoiceDetail;
}

export function InvoiceDetailsCards({ invoice }: InvoiceDetailsCardsProps) {
  const hasDiscount = invoice.discountAmount && invoice.discountAmount !== "0";
  const hasRoundOff = invoice.roundOffAmount && invoice.roundOffAmount !== "0";

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">Financial Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sub Total</span>
          <span className="tabular-nums">{formatCurrency(invoice.subTotal)}</span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="tabular-nums">−{formatCurrency(invoice.discountAmount ?? "0")}</span>
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
        {hasRoundOff && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Round Off</span>
            <span className="tabular-nums">{formatCurrency(invoice.roundOffAmount ?? "0")}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Grand Total</span>
          <span className="tabular-nums">{formatCurrency(invoice.totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
