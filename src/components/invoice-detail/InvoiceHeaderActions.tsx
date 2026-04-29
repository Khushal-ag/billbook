import type { ReactNode } from "react";
import {
  Download,
  Loader2,
  Pencil,
  CreditCard,
  MessageCircle,
  Mail,
  Banknote,
  FileMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  invoiceTypeSupportsBalanceReminderEmail,
  invoiceTypeSupportsDocumentShareLog,
  invoiceTypeSupportsReceiptPayment,
  invoiceTypeSupportsSaleReturnRefund,
  invoiceTypeSupportsSupplierPayment,
} from "@/lib/invoice/invoice";
import { formatCurrency } from "@/lib/core/utils";
import type { InvoiceDetail } from "@/types/invoice";

const FINALIZE_INVENTORY_HELP: ReactNode = (
  <div className="space-y-2 text-xs leading-snug">
    <p>
      Finalizing updates stock: it can reduce quantity on sales, put quantity back on sale returns,
      add batches from purchase bills, or reduce batches on purchase returns, depending on this
      document. If something went wrong, you can try again—a bill that is already finalized will not
      change stock twice.
    </p>
    <p className="border-t border-border/60 pt-2 text-muted-foreground">
      <span className="font-medium text-foreground">Payments:</span> Finalizing does{" "}
      <span className="font-medium text-foreground">not</span> take opening balances or customer
      advances off the bill. For <strong>sales</strong>, use{" "}
      <span className="text-foreground">Record payment</span> or allocate receipts (including
      opening advance receipts). For <strong>purchases</strong>, use{" "}
      <span className="text-foreground">Record supplier payment</span>—the{" "}
      <span className="font-medium text-foreground">Paid</span> amount on the bill only changes when
      you record those payments.
    </p>
  </div>
);

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
  canEditDraft: boolean;
  canCancelDraft: boolean;
  canFinalizeDraft: boolean;
  canRecordPayment: boolean;
  canOutboundRefund: boolean;
  canCreateRefundCreditNote: boolean;
  canPdf: boolean;
  canCommunication: boolean;
  balanceDueValue: number;
  balanceDue: string;
  sentToday: boolean;
  reminderToday: boolean;
  pdfUrl?: string | null;
  pdfError?: Error | null;
  /** True while the signed PDF URL is still loading (FINAL invoices only). */
  isInvoicePdfPending?: boolean;
  isFinalizePending: boolean;
  isCancelPending: boolean;
  isMarkSentPending: boolean;
  isMarkReminderPending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onFinalize: () => void;
  onOpenPayment: () => void;
  /** Sales return: pay customer refund (outbound payout). */
  onOpenRefund?: () => void;
  /** Sales return: open credit note dialog for this return (refund generation). */
  onOpenRefundCreditNote?: () => void;
  onOpenPdf?: () => void;
  onMarkSent: () => void;
  onMarkReminder: () => void;
}

export function InvoiceHeaderActions({
  invoice,
  canEditDraft,
  canCancelDraft,
  canFinalizeDraft,
  canRecordPayment,
  canOutboundRefund,
  canCreateRefundCreditNote,
  canPdf,
  canCommunication,
  balanceDueValue,
  balanceDue,
  sentToday,
  reminderToday,
  pdfUrl,
  pdfError,
  isInvoicePdfPending,
  isFinalizePending,
  isCancelPending,
  isMarkSentPending,
  isMarkReminderPending,
  onEdit,
  onCancel,
  onFinalize,
  onOpenPayment,
  onOpenRefund,
  onOpenRefundCreditNote,
  onOpenPdf,
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
          {canEditDraft && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {canCancelDraft && (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isCancelPending}>
              Cancel Invoice
            </Button>
          )}
          {canFinalizeDraft && (
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
          )}
        </>
      )}

      {invoice.status === "FINAL" && showRecordPayment && canRecordPayment && (
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

      {invoice.status === "FINAL" && showRecordRefund && canOutboundRefund && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenRefund}
            disabled={balanceDueValue <= 0}
            className={balanceDueValue <= 0 ? "cursor-not-allowed opacity-50" : ""}
            title={
              balanceDueValue <= 0
                ? "Return is fully settled. Nothing left to pay out."
                : `Pay refund to customer (owing: ${formatCurrency(balanceDue)})`
            }
          >
            <Banknote className="mr-2 h-3.5 w-3.5" />
            Pay refund
          </Button>
          {onOpenRefundCreditNote && canCreateRefundCreditNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRefundCreditNote}
              title="Create a credit note for this return. Apply it to the customer’s account from Credit notes when ready."
            >
              <FileMinus className="mr-2 h-3.5 w-3.5" />
              Refund generation
            </Button>
          )}
        </>
      )}

      {invoice.status === "FINAL" && canCommunication && (showWhatsAppLog || showBalanceEmail) && (
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

      {invoice.status === "FINAL" && canPdf && isInvoicePdfPending && !pdfUrl && !pdfError && (
        <div role="status" aria-live="polite" aria-busy="true" className="inline-flex shrink-0">
          <Skeleton className="h-9 w-[4.25rem] rounded-md" />
          <span className="sr-only">Loading PDF…</span>
        </div>
      )}

      {pdfUrl && canPdf && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPdf}
            title="Saves a copy; if the file is a PDF, also opens a preview in a new tab"
            aria-label="Download invoice document; open PDF preview in a new tab when applicable"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </Button>
        </>
      )}

      {!pdfUrl && pdfError && invoice.status === "FINAL" && canPdf && (
        <Button variant="outline" size="sm" disabled title="PDF generation failed — try refreshing">
          <Download className="h-3.5 w-3.5" />
          PDF
        </Button>
      )}
    </div>
  );
}
