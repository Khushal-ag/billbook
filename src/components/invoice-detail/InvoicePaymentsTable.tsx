import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types/invoice";

interface InvoicePaymentsTableProps {
  payments: Payment[];
}

export function InvoicePaymentsTable({ payments }: InvoicePaymentsTableProps) {
  if (payments.length === 0) return null;
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="data-table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="py-3 pl-3 pr-8 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="py-3 pl-8 pr-4 text-left font-medium text-muted-foreground">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">{formatDate(p.createdAt)}</td>
                  <td className="px-3 py-3 font-medium">{p.paymentMethod}</td>
                  <td className="py-3 pl-3 pr-8 text-right font-semibold">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="py-3 pl-8 pr-4 text-muted-foreground">
                    {p.referenceNumber ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
