import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

interface InvoiceSummaryCardsProps {
  invoice: InvoiceDetail;
  balanceDue: string;
}

export function InvoiceSummaryCards({ invoice, balanceDue }: InvoiceSummaryCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-1">
            <StatusBadge status={invoice.status} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(invoice.totalAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(invoice.paidAmount ?? "0")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Balance Due</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(balanceDue)}</p>
          {invoice.isOverdue && invoice.overdueDays && invoice.overdueDays > 0 && (
            <p className="mt-1 text-xs text-destructive">Overdue by {invoice.overdueDays} days</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
