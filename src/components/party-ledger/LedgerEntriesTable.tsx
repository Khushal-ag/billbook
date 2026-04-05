import { Loader2 } from "lucide-react";
import type { LedgerEntry } from "@/lib/party-ledger";
import { PartyLedgerEntriesTable } from "@/components/party-ledger/PartyLedgerEntriesTable";

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

  return <PartyLedgerEntriesTable entries={entries} variant="ledger" />;
}
