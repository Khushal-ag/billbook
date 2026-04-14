import { Download, Loader2, Pencil, CreditCard, MessageCircle, Mail, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  invoiceTypeSupportsBalanceReminderEmail,
  invoiceTypeSupportsDocumentShareLog,
  invoiceTypeSupportsReceiptPayment,
  invoiceTypeSupportsSaleReturnRefund,
  invoiceTypeSupportsSupplierPayment,
} from "@/lib/invoice";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

const FINALIZE_INVENTORY_HELP =
  "Finalizing updates inventory: it can deduct stock (sales), add stock back (sale returns), create batches (purchase invoices), or remove quantity from batches (purchase returns), depending on this document. If the request fails, you can retry safely — an already finalized invoice returns success without duplicating stock effects.";

const NOTIFY_WHATSAPP_HELP = (
  <>
    <p className="font-medium">You shared the document</p>
    <p className="mt-1.5 text-muted-foreground">
      Saves that you told the party about this bill on WhatsApp (same summary as number, dates,
      totals, and balance). Real WhatsApp send is not live yet — you get a preview for now. Needs a
      phone on the party or consignee. At most once per day.
    </p>
  </>
);

const BALANCE_EMAIL_HELP = (
  <>
    <p className="font-medium">Follow up on money they owe you</p>
    <p className="mt-1.5 text-muted-foreground">
      <strong>Sales invoice:</strong> email the customer about payment still due.{" "}
      <strong>Purchase return:</strong> email the vendor about credit or refund still owed to you.
      Same figures as total, paid, and balance on this page. Party email, then consignee. At most
      once per day.
    </p>
  </>
);

interface InvoiceHeaderActionsProps {
  invoice: InvoiceDetail;
  isOwner: boolean;
  balanceDueValue: number;
  balanceDue: string;
  sentToday: boolean;
  reminderToday: boolean;
  pdfUrl?: string | null;
  pdfError?: Error | null;
  isFinalizePending: boolean;
  isCancelPending: boolean;
  isMarkSentPending: boolean;
  isMarkReminderPending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onFinalize: () => void;
  onOpenPayment: () => void;
  /** Sales return: record customer refund (outbound payout). */
  onOpenRefund?: () => void;
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
  pdfError,
  isFinalizePending,
  isCancelPending,
  isMarkSentPending,
  isMarkReminderPending,
  onEdit,
  onCancel,
  onFinalize,
  onOpenPayment,
  onOpenRefund,
  onMarkSent,
  onMarkReminder,
}: InvoiceHeaderActionsProps) {
  const showRecordPayment =
    invoiceTypeSupportsReceiptPayment(invoice.invoiceType) ||
    invoiceTypeSupportsSupplierPayment(invoice.invoiceType);
  const isSupplierBill = invoiceTypeSupportsSupplierPayment(invoice.invoiceType);
  const showRecordRefund =
    invoiceTypeSupportsSaleReturnRefund(invoice.invoiceType) && onOpenRefund != null;
  const showWhatsAppLog = invoiceTypeSupportsDocumentShareLog(invoice.invoiceType);
  const showBalanceEmail =
    invoice.status !== "CANCELLED" &&
    balanceDueValue > 0 &&
    invoiceTypeSupportsBalanceReminderEmail(invoice.invoiceType);

  return (
    <div className="flex gap-2">
      {invoice.status === "DRAFT" && (
        <>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          {isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={onCancel} disabled={isCancelPending}>
                Cancel Invoice
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button size="sm" onClick={onFinalize} disabled={isFinalizePending}>
                      {isFinalizePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Finalize
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm text-left text-xs leading-snug">
                  {FINALIZE_INVENTORY_HELP}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </>
      )}

      {invoice.status === "FINAL" && showRecordPayment && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPayment}
          disabled={balanceDueValue <= 0}
          className={balanceDueValue <= 0 ? "cursor-not-allowed opacity-50" : ""}
          title={
            balanceDueValue <= 0
              ? isSupplierBill
                ? "Bill is fully paid. No balance due to record."
                : "Invoice is fully paid. No balance due to record."
              : isSupplierBill
                ? `Record payment to supplier (Balance due: ${formatCurrency(balanceDue)})`
                : `Record payment (Balance due: ${formatCurrency(balanceDue)})`
          }
        >
          <CreditCard className="mr-2 h-3.5 w-3.5" />
          Record Payment
        </Button>
      )}

      {invoice.status === "FINAL" && showRecordRefund && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenRefund}
          disabled={balanceDueValue <= 0}
          className={balanceDueValue <= 0 ? "cursor-not-allowed opacity-50" : ""}
          title={
            balanceDueValue <= 0
              ? "Return is fully settled. Nothing left to refund."
              : `Record refund (Owing to customer: ${formatCurrency(balanceDue)})`
          }
        >
          <Banknote className="mr-2 h-3.5 w-3.5" />
          Record Refund
        </Button>
      )}

      {invoice.status === "FINAL" && (showWhatsAppLog || showBalanceEmail) && (
        <>
          {showWhatsAppLog && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMarkSent}
                    disabled={isMarkSentPending || sentToday}
                    aria-label={
                      sentToday
                        ? "WhatsApp share already logged today"
                        : "Log that you shared this document on WhatsApp"
                    }
                  >
                    {isMarkSentPending ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MessageCircle className="mr-2 h-3.5 w-3.5" />
                    )}
                    WhatsApp log
                  </Button>
                  {sentToday && (
                    <span className="mt-1 text-[11px] text-muted-foreground">Logged today</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-left text-xs leading-snug">
                {NOTIFY_WHATSAPP_HELP}
              </TooltipContent>
            </Tooltip>
          )}

          {showBalanceEmail && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMarkReminder}
                    disabled={isMarkReminderPending || reminderToday}
                    aria-label={
                      reminderToday
                        ? "Balance reminder email already sent today"
                        : "Email party about balance due on this document"
                    }
                  >
                    {isMarkReminderPending ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-3.5 w-3.5" />
                    )}
                    Balance email
                  </Button>
                  {reminderToday && (
                    <span className="mt-1 text-[11px] text-muted-foreground">Emailed today</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-left text-xs leading-snug">
                {BALANCE_EMAIL_HELP}
              </TooltipContent>
            </Tooltip>
          )}
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

      {!pdfUrl && pdfError && invoice.status === "FINAL" && (
        <Button variant="outline" size="sm" disabled title="PDF generation failed — try refreshing">
          <Download className="mr-2 h-3.5 w-3.5" />
          PDF unavailable
        </Button>
      )}
    </div>
  );
}
