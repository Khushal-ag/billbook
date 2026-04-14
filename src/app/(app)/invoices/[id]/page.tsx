"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvoiceDetailSkeleton from "@/components/skeletons/InvoiceDetailSkeleton";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { PageBackLink } from "@/components/PageBackLink";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import SupplierPaymentDialog from "@/components/dialogs/SupplierPaymentDialog";
import SaleReturnRefundDialog from "@/components/dialogs/SaleReturnRefundDialog";
import CancelInvoiceDialog from "@/components/dialogs/CancelInvoiceDialog";
import CreditNoteDialog from "@/components/dialogs/CreditNoteDialog";
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
import {
  getInvoiceBalanceDue,
  INVOICE_TYPE_OPTIONS,
  invoiceTypeSupportsBalanceReminderEmail,
  invoiceTypeSupportsDocumentShareLog,
  invoiceTypeSupportsReceiptPayment,
  invoiceTypeSupportsSaleReturnRefund,
  invoiceTypeSupportsSupplierPayment,
} from "@/lib/invoice";
import { withInvoiceQuantityErrorDetails } from "@/lib/invoice-quantity-error-details";
import { markReminderFeedbackMessage, markSentFeedbackMessage } from "@/lib/invoice-api-helpers";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/trial";
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
  const [supplierPaymentOpen, setSupplierPaymentOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [creditNoteOpen, setCreditNoteOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data: invoice, isPending, error } = useInvoice(invoiceId);
  const { data: businessProfile } = useBusinessProfile();
  const stockEntryIds =
    invoice?.items
      .map((item) => item.stockEntryId)
      .filter((id): id is number => id != null && Number.isFinite(id)) ?? [];
  const stockEntriesQuery = useStockEntriesByIds(stockEntryIds);
  const { data: pdfData, error: pdfError } = useInvoicePdf(
    invoice?.status === "FINAL" ? invoiceId : undefined,
  );
  const { data: auditData } = useResourceAuditLogs("INVOICE", invoiceId);
  const communicationsQuery = useInvoiceCommunications(invoiceId);
  const finalizeMutation = useFinalizeInvoice();
  const cancelMutation = useCancelInvoice();
  const markSentMutation = useMarkInvoiceSent(invoiceId ?? 0);
  const markReminderMutation = useMarkInvoiceReminder(invoiceId ?? 0);

  const sentToday = communicationsQuery.data?.sent.today ?? false;
  const reminderToday = communicationsQuery.data?.reminder.today ?? false;

  const finalizeGuard = useRef(false);
  const handleFinalize = async () => {
    if (!invoiceId || finalizeMutation.isPending || finalizeGuard.current) return;
    finalizeGuard.current = true;
    try {
      await finalizeMutation.mutateAsync(invoiceId);
      const type = invoice?.invoiceType;
      const paymentHint =
        type === "SALE_INVOICE"
          ? " To reduce what the customer owes, allocate receipts (including any opening advance receipt)—finalizing the invoice does not do that by itself."
          : type === "PURCHASE_INVOICE"
            ? " To reduce what you owe the supplier, record supplier payments—finalizing the bill does not pay it from opening balance or advance."
            : type === "SALE_RETURN" || type === "PURCHASE_RETURN"
              ? " Use Record payment or refund on this document to move money—finalizing alone does not pay or collect."
              : "";
      showSuccessToast(`Invoice finalized.${paymentHint}`);
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      if (err instanceof ApiClientError && err.status === 409) {
        showErrorToast(withInvoiceQuantityErrorDetails(err), "Insufficient stock");
      } else if (err instanceof ApiClientError && err.status === 400) {
        showErrorToast(withInvoiceQuantityErrorDetails(err), "Cannot finalize");
      } else {
        showErrorToast(withInvoiceQuantityErrorDetails(err), "Failed to finalize");
      }
    } finally {
      finalizeGuard.current = false;
    }
  };

  const handleCancel = () => {
    setCancelConfirm(true);
  };

  const handleMarkSent = async () => {
    if (!invoiceId || !invoice || !invoiceTypeSupportsDocumentShareLog(invoice.invoiceType)) return;
    if (markSentMutation.isPending || sentToday) return;
    try {
      const res = await markSentMutation.mutateAsync({});
      showSuccessToast(markSentFeedbackMessage(res));
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 503) {
        showErrorToast(err, "Could not complete request — try again later");
        return;
      }
      if (err instanceof ApiClientError && (err.status === 409 || err.status === 400)) {
        showErrorToast(err, "Can't log WhatsApp");
        return;
      }
      showErrorToast(err, "WhatsApp log failed");
    }
  };

  const handleMarkReminder = async () => {
    if (!invoiceId || !invoice) return;
    if (
      invoice.status === "CANCELLED" ||
      !invoiceTypeSupportsBalanceReminderEmail(invoice.invoiceType) ||
      getInvoiceBalanceDue(invoice) <= 0
    ) {
      return;
    }
    if (markReminderMutation.isPending || reminderToday) return;
    try {
      const res = await markReminderMutation.mutateAsync({});
      showSuccessToast(markReminderFeedbackMessage(res));
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 503) {
        showErrorToast(err, "Email failed — check SMTP or try later");
        return;
      }
      if (err instanceof ApiClientError && (err.status === 409 || err.status === 400)) {
        showErrorToast(err, "Can't send reminder");
        return;
      }
      showErrorToast(err, "Reminder failed");
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
        <PageBackLink href="/invoices">Back to invoices</PageBackLink>
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
      <PageBackLink href={typeMeta?.path ?? "/invoices"}>
        Back to {typeMeta?.label ?? "invoices"}
      </PageBackLink>

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
                pdfError={pdfError}
                isFinalizePending={finalizeMutation.isPending}
                isCancelPending={cancelMutation.isPending}
                isMarkSentPending={markSentMutation.isPending}
                isMarkReminderPending={markReminderMutation.isPending}
                onEdit={() => router.push(`/invoices/${invoiceId}/edit`)}
                onCancel={handleCancel}
                onFinalize={handleFinalize}
                onOpenPayment={() =>
                  invoice.invoiceType === "PURCHASE_INVOICE"
                    ? setSupplierPaymentOpen(true)
                    : setPaymentOpen(true)
                }
                onOpenRefund={
                  invoiceTypeSupportsSaleReturnRefund(invoice.invoiceType)
                    ? () => setRefundOpen(true)
                    : undefined
                }
                onOpenRefundCreditNote={
                  invoiceTypeSupportsSaleReturnRefund(invoice.invoiceType)
                    ? () => setCreditNoteOpen(true)
                    : undefined
                }
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
            invoiceType={invoice.invoiceType}
          />
          <InvoicePaymentsTable payments={invoice.payments} />
          {auditData?.logs && <InvoiceAuditHistory logs={auditData.logs} />}

          {invoice.status === "FINAL" &&
            invoiceId &&
            invoiceTypeSupportsReceiptPayment(invoice.invoiceType) && (
              <PaymentDialog
                open={paymentOpen}
                onOpenChange={setPaymentOpen}
                invoiceId={invoiceId}
                balanceDue={balanceDue}
              />
            )}

          {invoice.status === "FINAL" &&
            invoiceId &&
            invoiceTypeSupportsSupplierPayment(invoice.invoiceType) && (
              <SupplierPaymentDialog
                open={supplierPaymentOpen}
                onOpenChange={setSupplierPaymentOpen}
                invoiceId={invoiceId}
                balanceDue={balanceDue}
              />
            )}

          {invoice.status === "FINAL" &&
            invoiceId &&
            invoiceTypeSupportsSaleReturnRefund(invoice.invoiceType) && (
              <SaleReturnRefundDialog
                open={refundOpen}
                onOpenChange={setRefundOpen}
                invoiceId={invoiceId}
                partyId={invoice.partyId}
                refundDue={balanceDue}
              />
            )}

          <CancelInvoiceDialog
            open={cancelConfirm}
            onOpenChange={setCancelConfirm}
            onConfirm={confirmCancel}
            isPending={cancelMutation.isPending}
          />

          {invoice.invoiceType === "SALE_RETURN" && invoiceId != null && (
            <CreditNoteDialog
              open={creditNoteOpen}
              onOpenChange={setCreditNoteOpen}
              lockedInvoiceId={invoiceId}
            />
          )}
        </>
      )}
    </div>
  );
}
