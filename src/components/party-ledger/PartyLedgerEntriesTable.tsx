import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { formatLedgerEntryTypeLabel } from "@/lib/party-ledger-display";
import type { LedgerEntry } from "@/lib/party-ledger";
import { LedgerBalanceText } from "@/components/party-ledger/LedgerBalanceText";

export type PartyLedgerTableVariant = "ledger" | "statement";

interface PartyLedgerEntriesTableProps {
  entries: LedgerEntry[];
  /** `ledger`: hide Debit/Credit on very small screens. `statement`: always show all columns. */
  variant: PartyLedgerTableVariant;
}

/**
 * Shared transaction table for the Ledger tab and Statement tab (same columns, no duplicated markup).
 */
export function PartyLedgerEntriesTable({ entries, variant }: PartyLedgerEntriesTableProps) {
  const drCrHide = variant === "ledger" ? "hidden sm:table-cell" : "";

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[280px] text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-left font-medium">Entry</th>
            <th className={cn("px-3 py-2 text-right font-medium", drCrHide)}>Debit</th>
            <th className={cn("px-3 py-2 text-right font-medium", drCrHide)}>Credit</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={`${entry.entryType}-${idx}`} className="border-t">
              <td className="px-3 py-2 text-muted-foreground">
                {formatDate(entry.entryDate ?? entry.createdAt)}
              </td>
              <td className="px-3 py-2">{formatLedgerEntryTypeLabel(entry.entryType)}</td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  drCrHide,
                  entry.debitAmount && "font-medium text-red-600 dark:text-red-400",
                )}
              >
                {entry.debitAmount ? formatCurrency(entry.debitAmount) : "—"}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  drCrHide,
                  entry.creditAmount && "font-medium text-emerald-600 dark:text-emerald-400",
                )}
              >
                {entry.creditAmount ? formatCurrency(entry.creditAmount) : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <LedgerBalanceText
                  value={entry.runningBalance}
                  size="sm"
                  align="end"
                  tagStyle="abbrev"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
