import { CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import type { CreditNote } from "@/types/credit-note";

interface CreditNotesTableProps {
  creditNotes: CreditNote[];
  isOwner: boolean;
  finalizePending: boolean;
  deletePending: boolean;
  onFinalize: (id: number) => void;
  onDelete: (id: number) => void;
}

export function CreditNotesTable({
  creditNotes,
  isOwner,
  finalizePending,
  deletePending,
  onFinalize,
  onDelete,
}: CreditNotesTableProps) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm" role="table" aria-label="Credit notes list">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Credit Note #
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              Invoice ID
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              Reason
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Amount
            </th>
            <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
              Status
            </th>
            {isOwner && (
              <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {creditNotes.map((cn) => (
            <tr key={cn.id} className="border-b transition-colors last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-medium sm:px-6">{cn.creditNoteNumber}</td>
              <td className="hidden px-3 py-3 text-accent md:table-cell">#{cn.invoiceId}</td>
              <td className="hidden max-w-[240px] truncate px-3 py-3 text-muted-foreground md:table-cell">
                {cn.reason ?? "—"}
              </td>
              <td className="px-3 py-3 text-right font-medium">{formatCurrency(cn.amount)}</td>
              <td className="px-3 py-3 text-center">
                <StatusBadge status={cn.status} />
              </td>
              {isOwner && (
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {cn.status === "DRAFT" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFinalize(cn.id)}
                          disabled={finalizePending}
                          title="Finalize"
                          aria-label={`Finalize credit note ${cn.creditNoteNumber}`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(cn.id)}
                          disabled={deletePending}
                          title="Delete"
                          aria-label={`Delete credit note ${cn.creditNoteNumber}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
