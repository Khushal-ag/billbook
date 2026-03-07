import { History, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import { formatCurrency } from "@/lib/utils";
import type { Party } from "@/types/party";

interface PartiesTableProps {
  parties: Party[];
  onEdit: (party: Party) => void;
  onLedger: (partyId: number) => void;
}

export function PartiesTable({ parties, onEdit, onLedger }: PartiesTableProps) {
  const isSimpleMode = useIsSimpleMode();

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
              Opening Balance
            </th>
            <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {parties.map((party) => (
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
              <td className="px-3 py-3 text-right font-medium">
                {formatCurrency(party.openingBalance ?? "0")}
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
                  {!isSimpleMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLedger(party.id)}
                      title="Account History"
                      aria-label={`View account history for ${party.name}`}
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
