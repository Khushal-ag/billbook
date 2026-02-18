import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface SalesSummary {
  totalAmount?: string;
  totalInvoices?: number;
}

interface SalesRow {
  invoiceNumber: string;
  partyName: string;
  date: string;
  totalAmount: string;
  totalTax: string;
}

interface SalesReportCardProps {
  summary?: SalesSummary | null;
  rows: SalesRow[];
}

export function SalesReportCard({ summary, rows }: SalesReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Sales Report — ₹{summary?.totalAmount ?? "0"} total, {summary?.totalInvoices ?? 0}{" "}
          invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="data-table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">
                    Invoice
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Party</th>
                  <th className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Date
                  </th>
                  <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                    Sub Total
                  </th>
                  <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                    Tax
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-6">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.invoiceNumber} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-accent sm:px-6">
                      {row.invoiceNumber}
                    </td>
                    <td className="px-3 py-3">{row.partyName}</td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                      {formatDate(row.date)}
                    </td>
                    <td className="hidden px-3 py-3 text-right lg:table-cell">
                      ₹{parseFloat(row.totalAmount) - parseFloat(row.totalTax)}
                    </td>
                    <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.totalTax}</td>
                    <td className="px-3 py-3 text-right font-medium sm:px-6">₹{row.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sales data for this period.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
