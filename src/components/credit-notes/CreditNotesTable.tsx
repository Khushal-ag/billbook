import { Eye, Trash2 } from "lucide-react";
import { LinkedInvoiceLink } from "@/components/invoices/LinkedInvoiceLink";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import type { CreditNoteSummary } from "@/types/credit-note";

interface CreditNotesTableProps {
  creditNotes: CreditNoteSummary[];
  isOwner: boolean;
  deletePendingId: number | null;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

export function CreditNotesTable({
  creditNotes,
  isOwner,
  deletePendingId,
  onView,
  onDelete,
}: CreditNotesTableProps) {
  return (
    <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
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
              Linked invoice
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
            <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {creditNotes.map((cn) => (
            <tr
              key={cn.id}
              className="border-b transition-colors last:border-0 hover:bg-muted/20"
              role="button"
              tabIndex={0}
              onClick={() => onView(cn.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onView(cn.id)}
            >
              <td className="px-4 py-3 font-medium sm:px-6">
                <button
                  type="button"
                  className="text-left text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(cn.id);
                  }}
                >
                  {cn.creditNoteNumber}
                </button>
              </td>
              <td className="hidden px-3 py-3 md:table-cell">
                <LinkedInvoiceLink
                  invoiceId={cn.invoiceId}
                  invoiceNumber={cn.invoiceNumber}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="hidden max-w-[240px] truncate px-3 py-3 text-muted-foreground md:table-cell">
                {cn.reason ?? "—"}
              </td>
              <td className="px-3 py-3 text-right font-medium">{formatCurrency(cn.amount)}</td>
              <td className="px-3 py-3 text-center">
                <StatusBadge status={cn.status} />
              </td>
              <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(cn.id);
                    }}
                    title="Open credit note"
                    aria-label={`Open credit note ${cn.creditNoteNumber}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {isOwner && cn.deletedAt == null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(cn.id);
                      }}
                      disabled={deletePendingId === cn.id}
                      title="Delete (only succeeds when nothing is allocated)"
                      aria-label={`Delete credit note ${cn.creditNoteNumber}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
