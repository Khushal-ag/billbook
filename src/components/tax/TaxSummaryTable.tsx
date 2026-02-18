import { formatMonthYear } from "@/lib/utils";

interface MonthlyTaxRow {
  month: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
  totalAmount: string;
  invoiceCount?: number;
}

interface TaxSummaryTableProps {
  rows: MonthlyTaxRow[];
  totalCgst?: string;
  totalSgst?: string;
  totalIgst?: string;
  totalTax: string;
  totalAmount: string;
  invoiceCount: number;
}

export function TaxSummaryTable({
  rows,
  totalCgst,
  totalSgst,
  totalIgst,
  totalTax,
  totalAmount,
  invoiceCount,
}: TaxSummaryTableProps) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">Month</th>
            <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell">
              CGST
            </th>
            <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell">
              SGST
            </th>
            <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell">
              IGST
            </th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Total Tax</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Total Amount</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-6">
              Invoices
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium sm:px-6">{formatMonthYear(row.month)}</td>
              <td className="hidden px-3 py-3 text-right md:table-cell">₹{row.cgst}</td>
              <td className="hidden px-3 py-3 text-right md:table-cell">₹{row.sgst}</td>
              <td className="hidden px-3 py-3 text-right md:table-cell">₹{row.igst}</td>
              <td className="px-3 py-3 text-right font-medium">₹{row.totalTax}</td>
              <td className="px-3 py-3 text-right">₹{row.totalAmount}</td>
              <td className="px-3 py-3 text-right sm:px-6">{row.invoiceCount}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 font-medium">
            <td className="px-4 py-3 sm:px-6">Total</td>
            <td className="hidden px-3 py-3 text-right md:table-cell">₹{totalCgst ?? "0"}</td>
            <td className="hidden px-3 py-3 text-right md:table-cell">₹{totalSgst ?? "0"}</td>
            <td className="hidden px-3 py-3 text-right md:table-cell">₹{totalIgst ?? "0"}</td>
            <td className="px-3 py-3 text-right">₹{totalTax}</td>
            <td className="px-3 py-3 text-right">₹{totalAmount}</td>
            <td className="px-3 py-3 text-right sm:px-6">{invoiceCount}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
