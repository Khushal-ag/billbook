import { Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LedgerEntry } from "@/lib/party-ledger";

interface LedgerEntriesTableProps {
  isPending: boolean;
  entries?: LedgerEntry[];
}

export function LedgerEntriesTable({ isPending, entries }: LedgerEntriesTableProps) {
  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading ledger...
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <p className="rounded-md border bg-muted/10 p-4 text-sm text-muted-foreground">
        No ledger entries yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-right font-medium">Debit</th>
            <th className="px-3 py-2 text-right font-medium">Credit</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={`${entry.entryType}-${idx}`} className="border-t">
              <td className="px-3 py-2 text-muted-foreground">{formatDate(entry.entryDate)}</td>
              <td className="px-3 py-2">{entry.entryType}</td>
              <td className="px-3 py-2 text-right">
                {entry.debitAmount ? formatCurrency(entry.debitAmount) : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                {entry.creditAmount ? formatCurrency(entry.creditAmount) : "—"}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {formatCurrency(entry.runningBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
