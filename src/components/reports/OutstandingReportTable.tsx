interface OutstandingRow {
  partyId: number;
  partyName: string;
  totalInvoiced: string;
  totalPaid: string;
  outstanding: string;
}

export function OutstandingReportTable({ rows }: { rows: OutstandingRow[] }) {
  return (
    <div className="data-table-container">
      <table className="w-full min-w-[320px] text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Party
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell"
            >
              Invoiced
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell"
            >
              Paid
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right font-medium text-muted-foreground sm:px-6"
            >
              Outstanding
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.partyId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium sm:px-6">{p.partyName}</td>
              <td className="hidden px-3 py-3 text-right md:table-cell">₹{p.totalInvoiced}</td>
              <td className="hidden px-3 py-3 text-right md:table-cell">₹{p.totalPaid}</td>
              <td className="px-4 py-3 text-right font-medium sm:px-6">₹{p.outstanding}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
