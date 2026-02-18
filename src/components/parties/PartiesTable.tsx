import { History, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIMode } from "@/contexts/UIModeContext";
import { formatCurrency } from "@/lib/utils";
import type { Party } from "@/types/party";

interface PartiesTableProps {
  parties: Party[];
  isOwner: boolean;
  deletePending: boolean;
  onEdit: (party: Party) => void;
  onLedger: (partyId: number) => void;
  onDelete: (party: Party) => void;
}

export function PartiesTable({
  parties,
  isOwner,
  deletePending,
  onEdit,
  onLedger,
  onDelete,
}: PartiesTableProps) {
  const { mode } = useUIMode();
  const isSimpleMode = mode === "simple";

  return (
    <div className="data-table-container">
      <table className="w-full text-sm" role="table" aria-label="Parties list">
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
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(party)}
                    disabled={deletePending}
                    title="Delete"
                    aria-label={`Delete ${party.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
