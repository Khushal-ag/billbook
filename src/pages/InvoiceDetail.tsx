import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import InvoiceDetailSkeleton from "@/components/skeletons/InvoiceDetailSkeleton";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import InvoiceEditDialog from "@/components/dialogs/InvoiceEditDialog";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  InvoiceHeaderActions,
  InvoiceSummaryCards,
  InvoiceDetailsCards,
  InvoiceLineItemsTable,
  InvoicePaymentsTable,
  InvoiceAuditHistory,
} from "@/components/invoice-detail/InvoiceDetailSections";
import {
  useInvoice,
  useFinalizeInvoice,
  useCancelInvoice,
  useInvoicePdf,
  useMarkInvoiceSent,
  useMarkInvoiceReminder,
  useInvoiceCommunications,
} from "@/hooks/use-invoices";
import { usePermissions } from "@/hooks/use-permissions";
import { useResourceAuditLogs } from "@/hooks/use-audit-logs";
import { formatDate } from "@/lib/utils";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";
import { ApiClientError } from "@/api/error";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = id ? Number(id) : undefined;
  const { isOwner } = usePermissions();

  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data: invoice, isPending, error } = useInvoice(invoiceId);
  const { data: pdfData } = useInvoicePdf(invoice?.status === "FINAL" ? invoiceId : undefined);
  const { data: auditData } = useResourceAuditLogs("INVOICE", invoiceId);
  const communicationsQuery = useInvoiceCommunications(invoiceId);
  const finalizeMutation = useFinalizeInvoice();
  const cancelMutation = useCancelInvoice();
  const markSentMutation = useMarkInvoiceSent(invoiceId ?? 0);
  const markReminderMutation = useMarkInvoiceReminder(invoiceId ?? 0);

  const sentToday = communicationsQuery.data?.sent.today ?? false;
  const reminderToday = communicationsQuery.data?.reminder.today ?? false;

  const handleFinalize = async () => {
    if (!invoiceId) return;
    try {
      await finalizeMutation.mutateAsync(invoiceId);
      showSuccessToast("Invoice finalized");
    } catch (err) {
      showErrorToast(err, "Failed to finalize");
    }
  };

  const handleCancel = () => {
    setCancelConfirm(true);
  };

  const handleMarkSent = async () => {
    if (!invoiceId) return;
    if (markSentMutation.isPending) return;
    try {
      await markSentMutation.mutateAsync({ channel: "WHATSAPP" });
      showSuccessToast("Invoice marked as sent");
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 409 || err.status === 400)) {
        showSuccessToast("Invoice already marked as sent");
        return;
      }
      showErrorToast(err, "Failed to mark as sent");
    }
  };

  const handleMarkReminder = async () => {
    if (!invoiceId) return;
    if (markReminderMutation.isPending) return;
    try {
      await markReminderMutation.mutateAsync({ channel: "EMAIL" });
      showSuccessToast("Reminder recorded");
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 409 || err.status === 400)) {
        showSuccessToast("Reminder already recorded");
        return;
      }
      showErrorToast(err, "Failed to mark reminder");
    }
  };

  const confirmCancel = async () => {
    if (!invoiceId) return;
    try {
      await cancelMutation.mutateAsync(invoiceId);
      showSuccessToast("Invoice cancelled");
      setCancelConfirm(false);
      navigate("/invoices");
    } catch (err) {
      showErrorToast(err, "Failed to cancel");
      setCancelConfirm(false);
    }
  };

  if (isPending) {
    return <InvoiceDetailSkeleton />;
  }

  // Calculate balance due
  const balanceDue = invoice
    ? (invoice.dueAmount ??
      String(
        parseFloat((invoice.totalAmount ?? "0").replace(/,/g, "")) -
          parseFloat((invoice.paidAmount ?? "0").replace(/,/g, "")),
      ))
    : "0";
  const balanceDueValue = parseFloat(balanceDue.replace(/,/g, "")) || 0;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-4">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Invoices
        </Link>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load invoice" />

      {!invoice ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Invoice not found.</p>
      ) : (
        <>
          <PageHeader
            title={`Invoice ${invoice.invoiceNumber}`}
            description={`Created ${formatDate(invoice.createdAt)}`}
            action={
              <InvoiceHeaderActions
                invoice={invoice}
                isOwner={isOwner}
                balanceDueValue={balanceDueValue}
                balanceDue={balanceDue}
                sentToday={sentToday}
                reminderToday={reminderToday}
                pdfUrl={pdfData?.downloadUrl}
                isFinalizePending={finalizeMutation.isPending}
                isCancelPending={cancelMutation.isPending}
                isMarkSentPending={markSentMutation.isPending}
                isMarkReminderPending={markReminderMutation.isPending}
                onEdit={() => setEditOpen(true)}
                onCancel={handleCancel}
                onFinalize={handleFinalize}
                onOpenPayment={() => setPaymentOpen(true)}
                onMarkSent={handleMarkSent}
                onMarkReminder={handleMarkReminder}
              />
            }
          />

          <InvoiceSummaryCards invoice={invoice} balanceDue={balanceDue} />
          <InvoiceDetailsCards invoice={invoice} />
          <InvoiceLineItemsTable items={invoice.items} />
          <InvoicePaymentsTable payments={invoice.payments} />
          {auditData?.logs && <InvoiceAuditHistory logs={auditData.logs} />}

          {/* Dialogs */}
          {invoice.status === "DRAFT" && (
            <InvoiceEditDialog open={editOpen} onOpenChange={setEditOpen} invoice={invoice} />
          )}
          {invoice.status === "FINAL" && invoiceId && (
            <PaymentDialog
              open={paymentOpen}
              onOpenChange={setPaymentOpen}
              invoiceId={invoiceId}
              balanceDue={invoice.dueAmount ?? balanceDue}
            />
          )}

          <ConfirmDialog
            open={cancelConfirm}
            onOpenChange={setCancelConfirm}
            onConfirm={confirmCancel}
            title="Cancel Invoice"
            description="Are you sure you want to cancel this invoice? This action cannot be undone."
            confirmText="Cancel Invoice"
            variant="destructive"
          />
        </>
      )}
    </div>
  );
}
