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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Party</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Invoiced</th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">Paid</th>
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.partyId} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-6 py-3 font-medium">{p.partyName}</td>
              <td className="px-3 py-3 text-right">₹{p.totalInvoiced}</td>
              <td className="px-3 py-3 text-right">₹{p.totalPaid}</td>
              <td className="px-6 py-3 text-right font-medium">₹{p.outstanding}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
