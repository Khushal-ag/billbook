import Link from "next/link";
import { LinkedInvoiceLink } from "@/components/invoices/LinkedInvoiceLink";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CreditNoteSummary } from "@/types/credit-note";

interface CreditNotesTableProps {
  creditNotes: CreditNoteSummary[];
  onView: (id: number) => void;
}

/** Remaining unallocated amount for list row (matches GET /credit-notes when fields are present). */
function resolvedUnallocated(cn: CreditNoteSummary): number | null {
  if (cn.unallocatedAmount != null && cn.unallocatedAmount !== "") {
    const n = parseFloat(cn.unallocatedAmount);
    return Number.isFinite(n) ? n : null;
  }
  const total = parseFloat(cn.amount) || 0;
  if (cn.allocatedAmount != null && cn.allocatedAmount !== "") {
    const alloc = parseFloat(cn.allocatedAmount) || 0;
    return Math.max(0, total - alloc);
  }
  return null;
}

function canAllocateCreditNote(cn: CreditNoteSummary): boolean {
  const u = resolvedUnallocated(cn);
  if (u === null) return true;
  return u > 0.001;
}

export function CreditNotesTable({ creditNotes, onView }: CreditNotesTableProps) {
  return (
    <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
      <table className="w-full text-sm" role="table" aria-label="Credit notes list">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Credit note
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              Linked invoice
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground lg:table-cell"
            >
              Reason
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Amount
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-right font-medium text-muted-foreground sm:table-cell"
            >
              Unallocated
            </th>
            <th
              scope="col"
              className="px-2 py-3 text-right font-medium text-muted-foreground sm:px-3"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {creditNotes.map((cn) => {
            const allocate = canAllocateCreditNote(cn);
            const unalloc = resolvedUnallocated(cn);
            return (
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
                <td className="hidden max-w-[200px] truncate px-3 py-3 text-muted-foreground lg:table-cell">
                  {cn.reason ?? "—"}
                </td>
                <td className="px-3 py-3 text-right font-medium tabular-nums">
                  {formatCurrency(cn.amount)}
                </td>
                <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">
                  {unalloc != null ? (
                    unalloc > 0.001 ? (
                      <span className="font-medium text-amber-800 dark:text-amber-200">
                        {formatCurrency(String(unalloc))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-2 py-3 text-right sm:px-3">
                  <div
                    className="flex flex-wrap items-center justify-end gap-1 sm:justify-end sm:gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allocate ? (
                      <Button variant="default" size="sm" className="h-8 shrink-0" asChild>
                        <Link href={`/credit-notes/${cn.id}#credit-note-allocate`}>Allocate</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 text-muted-foreground"
                        disabled
                        title="Fully allocated — open the credit note from the number above to review"
                      >
                        Allocate
                      </Button>
                    )}
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
