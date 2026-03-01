import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { useCreditNote } from "@/hooks/use-credit-notes";
import { FileText } from "lucide-react";

interface CreditNoteDetailSheetProps {
  creditNoteId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditNoteDetailSheet({
  creditNoteId,
  open,
  onOpenChange,
}: CreditNoteDetailSheetProps) {
  const {
    data: creditNote,
    isPending,
    error,
  } = useCreditNote(open ? (creditNoteId ?? undefined) : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Credit Note
          </SheetTitle>
          <SheetDescription>
            {creditNote ? `Details for ${creditNote.creditNoteNumber}` : "View credit note details"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
          {isPending && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {error && <p className="text-sm text-destructive">Failed to load credit note details.</p>}

          {!isPending && !error && creditNote && (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Credit Note #
                </dt>
                <dd className="mt-1 font-medium">{creditNote.creditNoteNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={creditNote.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Invoice
                </dt>
                <dd className="mt-1">
                  <Link
                    to={`/invoices/${creditNote.invoiceId}`}
                    className="text-primary hover:underline"
                  >
                    #{creditNote.invoiceId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Amount
                </dt>
                <dd className="mt-1 font-semibold">{formatCurrency(creditNote.amount)}</dd>
              </div>
              {creditNote.reason && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Reason
                  </dt>
                  <dd className="mt-1 text-muted-foreground">{creditNote.reason}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Affects inventory
                </dt>
                <dd className="mt-1">{creditNote.affectsInventory ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </dt>
                <dd className="mt-1 text-muted-foreground">{formatDate(creditNote.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Updated
                </dt>
                <dd className="mt-1 text-muted-foreground">{formatDate(creditNote.updatedAt)}</dd>
              </div>
            </dl>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
