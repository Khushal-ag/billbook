import { Download, Loader2, Pencil, CreditCard, Send, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIMode } from "@/contexts/UIModeContext";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

interface InvoiceHeaderActionsProps {
  invoice: InvoiceDetail;
  isOwner: boolean;
  balanceDueValue: number;
  balanceDue: string;
  sentToday: boolean;
  reminderToday: boolean;
  pdfUrl?: string | null;
  isFinalizePending: boolean;
  isCancelPending: boolean;
  isMarkSentPending: boolean;
  isMarkReminderPending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onFinalize: () => void;
  onOpenPayment: () => void;
  onMarkSent: () => void;
  onMarkReminder: () => void;
}

export function InvoiceHeaderActions({
  invoice,
  isOwner,
  balanceDueValue,
  balanceDue,
  sentToday,
  reminderToday,
  pdfUrl,
  isFinalizePending,
  isCancelPending,
  isMarkSentPending,
  isMarkReminderPending,
  onEdit,
  onCancel,
  onFinalize,
  onOpenPayment,
  onMarkSent,
  onMarkReminder,
}: InvoiceHeaderActionsProps) {
  const { mode } = useUIMode();
  const isSimpleMode = mode === "simple";

  return (
    <div className="flex gap-2">
      {invoice.status === "DRAFT" && isOwner && (
        <>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          {!isSimpleMode && (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isCancelPending}>
              Cancel Invoice
            </Button>
          )}
          <Button size="sm" onClick={onFinalize} disabled={isFinalizePending}>
            {isFinalizePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSimpleMode ? "Confirm Invoice" : "Finalize"}
          </Button>
        </>
      )}

      {invoice.status === "FINAL" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPayment}
          disabled={balanceDueValue <= 0}
          className={balanceDueValue <= 0 ? "cursor-not-allowed opacity-50" : ""}
          title={
            balanceDueValue <= 0
              ? "Invoice is fully paid. No balance due to record."
              : `Record payment (Balance due: ${formatCurrency(balanceDue)})`
          }
        >
          <CreditCard className="mr-2 h-3.5 w-3.5" />
          Record Payment
        </Button>
      )}

      {invoice.status === "FINAL" && !isSimpleMode && (
        <>
          <div className="flex flex-col">
            <Button variant="outline" size="sm" onClick={onMarkSent} disabled={isMarkSentPending}>
              {isMarkSentPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-2 h-3.5 w-3.5" />
              )}
              Mark Sent
            </Button>
            {sentToday && (
              <span className="mt-1 text-[11px] text-muted-foreground">Sent today</span>
            )}
          </div>

          <div className="flex flex-col">
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkReminder}
              disabled={isMarkReminderPending}
            >
              {isMarkReminderPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="mr-2 h-3.5 w-3.5" />
              )}
              Reminder
            </Button>
            {reminderToday && (
              <span className="mt-1 text-[11px] text-muted-foreground">Reminder today</span>
            )}
          </div>
        </>
      )}

      {pdfUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            <Download className="mr-2 h-3.5 w-3.5" />
            PDF
          </a>
        </Button>
      )}
    </div>
  );
}
