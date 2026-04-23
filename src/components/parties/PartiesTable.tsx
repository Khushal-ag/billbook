"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { History, Pencil } from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LedgerBalanceText } from "@/components/party-ledger/LedgerBalanceText";
import { queryKeys } from "@/lib/query/keys";
import type { Party, PartyBalanceResponse } from "@/types/party";

interface PartiesTableProps {
  parties: Party[];
  onEdit: (party: Party) => void;
  onLedger: (partyId: number) => void;
  /** When false, the account history (ledger) action is hidden. */
  showLedger?: boolean;
}

/** API may send balances as string or number; never call .trim on unknown types. */
function coerceBalanceText(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = typeof v === "string" ? v : String(v);
  const t = s.trim();
  return t === "" ? undefined : t;
}

export function PartiesTable({ parties, onEdit, onLedger, showLedger = true }: PartiesTableProps) {
  const idsToFetch = useMemo(
    () => parties.filter((p) => coerceBalanceText(p.currentBalance) == null).map((p) => p.id),
    [parties],
  );

  const idToQueryIndex = useMemo(() => {
    const m = new Map<number, number>();
    idsToFetch.forEach((id, i) => m.set(id, i));
    return m;
  }, [idsToFetch]);

  const balanceQueries = useQueries({
    queries: idsToFetch.map((id) => ({
      queryKey: queryKeys.parties.balance(id),
      queryFn: async () => {
        const res = await api.get<PartyBalanceResponse>(`/parties/${id}/balance`);
        return res.data;
      },
      staleTime: 60_000,
    })),
  });

  return (
    <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[320px] text-sm" role="table" aria-label="Parties list">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Name
            </th>
            <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
              Phone
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              GSTIN
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              State
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Current balance
            </th>
            <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {parties.map((party) => {
            const fromList = coerceBalanceText(party.currentBalance);
            const qIdx = idToQueryIndex.get(party.id);
            const q = qIdx != null ? balanceQueries[qIdx] : undefined;
            const fromFetch = coerceBalanceText(
              q?.data && typeof q.data === "object" && "currentBalance" in q.data
                ? (q.data as PartyBalanceResponse).currentBalance
                : undefined,
            );
            const value = fromList ?? fromFetch;
            const loading = fromList == null && q?.isPending;

            return (
              <tr
                key={party.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/20"
              >
                <td className="max-w-[200px] truncate px-4 py-3 font-medium sm:max-w-none sm:px-6">
                  {party.name}
                  {!party.isActive && (
                    <Badge variant="outline" className="ml-2 text-[10px] font-medium">
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{party.phone || "—"}</td>
                <td className="hidden px-3 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                  {party.gstin || "—"}
                </td>
                <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                  {party.state || "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {loading ? (
                    <span className="text-muted-foreground">…</span>
                  ) : value ? (
                    <LedgerBalanceText value={value} size="sm" align="end" tagStyle="abbrev" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(party)}
                      title="Edit"
                      aria-label={`Edit ${party.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {showLedger ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLedger(party.id)}
                        title="Account History"
                        aria-label={`View account history for ${party.name}`}
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
