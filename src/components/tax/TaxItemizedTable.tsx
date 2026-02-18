import { formatDate } from "@/lib/utils";

interface ItemizedTaxRow {
  invoiceId: number;
  invoiceNumber: string;
  partyName: string;
  invoiceDate: string;
  taxableAmount: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
}

export function TaxItemizedTable({ rows }: { rows: ItemizedTaxRow[] }) {
  return (
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
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Taxable</th>
            <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
              CGST
            </th>
            <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
              SGST
            </th>
            <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
              IGST
            </th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-6">
              Total Tax
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.invoiceId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium text-accent sm:px-6">{row.invoiceNumber}</td>
              <td className="px-3 py-3">{row.partyName}</td>
              <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                {formatDate(row.invoiceDate)}
              </td>
              <td className="px-3 py-3 text-right">₹{row.taxableAmount}</td>
              <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.cgst}</td>
              <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.sgst}</td>
              <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.igst}</td>
              <td className="px-3 py-3 text-right font-medium sm:px-6">₹{row.totalTax}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
