"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import InvoiceDetailSkeleton from "@/components/skeletons/InvoiceDetailSkeleton";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import CancelInvoiceDialog from "@/components/dialogs/CancelInvoiceDialog";
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
import { useStockEntriesByIds } from "@/hooks/use-items";
import { useBusinessProfile } from "@/hooks/use-business";
import { usePermissions } from "@/hooks/use-permissions";
import { useResourceAuditLogs } from "@/hooks/use-audit-logs";
import { getInvoiceBalanceDue, INVOICE_TYPE_OPTIONS } from "@/lib/invoice";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";
import { ApiClientError } from "@/api/error";

export default function InvoiceDetail() {
  const params = useParams<{ id?: string | string[] }>();
  const router = useRouter();
  const idParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const idParamStr = idParam != null ? String(idParam).trim() : "";
  const invoiceId = idParamStr && /^\d+$/.test(idParamStr) ? Number(idParamStr) : undefined;
  const invalidInvoiceId = Boolean(idParamStr) && invoiceId === undefined;
  const { isOwner } = usePermissions();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data: invoice, isPending, error } = useInvoice(invoiceId);
  const { data: businessProfile } = useBusinessProfile();
  const stockEntryIds = invoice?.items.map((item) => item.stockEntryId) ?? [];
  const stockEntriesQuery = useStockEntriesByIds(stockEntryIds);
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

  const confirmCancel = async (reason: string) => {
    if (!invoiceId) return;
    try {
      await cancelMutation.mutateAsync({ invoiceId, reason });
      showSuccessToast("Invoice cancelled");
      setCancelConfirm(false);
      const listPath =
        invoice && INVOICE_TYPE_OPTIONS.find((o) => o.type === invoice.invoiceType)?.path;
      router.push(listPath ?? "/invoices");
    } catch (err) {
      showErrorToast(err, "Failed to cancel");
    }
  };

  if (invalidInvoiceId) {
    return (
      <div className="page-container animate-fade-in">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Invoices
        </Link>
        <div className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          This URL doesn&apos;t look like a valid invoice ID (use a numeric id).
        </div>
      </div>
    );
  }

  if (isPending) {
    return <InvoiceDetailSkeleton />;
  }

  // Calculate balance due with fallback for inconsistent dueAmount from API.
  const balanceDueValue = invoice ? getInvoiceBalanceDue(invoice) : 0;
  const balanceDue = String(balanceDueValue);
  const typeMeta = invoice
    ? INVOICE_TYPE_OPTIONS.find((o) => o.type === invoice.invoiceType)
    : null;
  const purchaseDateByStockEntryId = Object.fromEntries(
    Object.values(stockEntriesQuery.data ?? {}).map((entry) => [entry.id, entry.purchaseDate]),
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-4">
        <Link
          href={typeMeta?.path ?? "/invoices"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {typeMeta?.label ?? "Invoices"}
        </Link>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load invoice" />

      {!invoice ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Invoice not found.</p>
      ) : (
        <>
          <PageHeader
            title={typeMeta?.label ?? "Invoice"}
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
                onEdit={() => router.push(`/invoices/${invoiceId}/edit`)}
                onCancel={handleCancel}
                onFinalize={handleFinalize}
                onOpenPayment={() => setPaymentOpen(true)}
                onMarkSent={handleMarkSent}
                onMarkReminder={handleMarkReminder}
              />
            }
          />

          <InvoiceSummaryCards
            invoice={invoice}
            balanceDue={balanceDue}
            businessLogoUrl={businessProfile?.logoUrl ?? null}
            businessName={businessProfile?.name ?? null}
          />
          <InvoiceDetailsCards invoice={invoice} />
          <InvoiceLineItemsTable
            items={invoice.items}
            purchaseDateByStockEntryId={purchaseDateByStockEntryId}
          />
          <InvoicePaymentsTable payments={invoice.payments} />
          {auditData?.logs && <InvoiceAuditHistory logs={auditData.logs} />}

          {/* Dialogs */}
          {invoice.status === "FINAL" && invoiceId && (
            <PaymentDialog
              open={paymentOpen}
              onOpenChange={setPaymentOpen}
              invoiceId={invoiceId}
              balanceDue={balanceDue}
            />
          )}

          <CancelInvoiceDialog
            open={cancelConfirm}
            onOpenChange={setCancelConfirm}
            onConfirm={confirmCancel}
            isPending={cancelMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
