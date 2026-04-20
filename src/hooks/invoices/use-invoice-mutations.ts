import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import type {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  RecordPaymentRequest,
  FinalizeInvoiceResponse,
  InvoiceMarkCommunicationRequest,
} from "@/types/invoice";
import {
  parseInvoiceMarkCommunicationResponse,
  parseRecordPaymentResponse,
  parseRecordSupplierPaymentResponse,
} from "@/lib/invoice-api-helpers";

/** Receipt detail embeds open invoices for the party; invalidate whenever invoice data changes. */
function invalidateReceiptAndPartyCaches(qc: QueryClient) {
  invalidateQueryKeys(qc, [
    queryKeys.receipts.root(),
    queryKeys.receipts.detailPrefix(),
    queryKeys.parties.ledgerPrefix(),
    queryKeys.parties.balancePrefix(),
  ]);
}

function invalidateDashboardAndReports(qc: QueryClient) {
  invalidateQueryKeys(qc, [queryKeys.business.dashboard()]);
  void qc.invalidateQueries({ queryKey: ["reports"], refetchType: "all" });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const res = await api.post<Invoice>("/invoices", data, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.invoices.root(), queryKeys.invoices.nextNumberRoot()]);
      invalidateReceiptAndPartyCaches(qc);
      invalidateDashboardAndReports(qc);
    },
  });
}

export function useUpdateInvoiceById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, body }: { invoiceId: number; body: UpdateInvoiceRequest }) => {
      const res = await api.put<Invoice>(`/invoices/${invoiceId}`, body);
      return res.data;
    },
    onSuccess: (_, { invoiceId }) => {
      invalidateQueryKeys(qc, [queryKeys.invoices.root(), queryKeys.invoices.detail(invoiceId)]);
      invalidateReceiptAndPartyCaches(qc);
    },
  });
}

export function useFinalizeInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<FinalizeInvoiceResponse>(
        `/invoices/${id}/finalize`,
        undefined,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: (_, id) => {
      invalidateQueryKeys(qc, [
        queryKeys.invoices.root(),
        queryKeys.invoices.detail(id),
        queryKeys.invoices.nextNumberRoot(),
        /** Purchase finalize creates/updates stock batches — refresh lists and entries. */
        queryKeys.items.root(),
        queryKeys.items.stockEntriesRoot(),
        queryKeys.items.stockPrefix(),
        queryKeys.items.stockEntryMapPrefix(),
        queryKeys.items.stockEntryDetailPrefix(),
      ]);
      invalidateReceiptAndPartyCaches(qc);
      invalidateDashboardAndReports(qc);
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: number; reason: string }) => {
      await api.delete(`/invoices/${invoiceId}`, { reason: reason.trim() });
    },
    onSuccess: (_, { invoiceId }) => {
      invalidateQueryKeys(qc, [
        queryKeys.invoices.root(),
        queryKeys.invoices.detail(invoiceId),
        queryKeys.invoices.nextNumberRoot(),
        queryKeys.items.root(),
        queryKeys.items.stockEntriesRoot(),
      ]);
      invalidateReceiptAndPartyCaches(qc);
      invalidateDashboardAndReports(qc);
    },
  });
}

export function useRecordPayment(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RecordPaymentRequest) => {
      const res = await api.post<unknown>(`/invoices/${invoiceId}/payments`, data);
      return parseRecordPaymentResponse(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.invoices.detail(invoiceId), queryKeys.invoices.root()]);
      invalidateReceiptAndPartyCaches(qc);
      invalidateDashboardAndReports(qc);
    },
  });
}

export function useRecordSupplierPayment(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RecordPaymentRequest) => {
      const res = await api.post<unknown>(
        `/invoices/${invoiceId}/supplier-payments`,
        data,
        generateIdempotencyKey(),
      );
      return parseRecordSupplierPaymentResponse(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.invoices.detail(invoiceId),
        queryKeys.invoices.root(),
        queryKeys.outboundPayments.root(),
      ]);
      invalidateReceiptAndPartyCaches(qc);
      invalidateDashboardAndReports(qc);
    },
  });
}

export function useMarkInvoiceSent(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data?: InvoiceMarkCommunicationRequest) => {
      const res = await api.post<unknown>(
        `/invoices/${invoiceId}/mark-sent`,
        data ?? {},
        generateIdempotencyKey(),
      );
      return parseInvoiceMarkCommunicationResponse(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.invoices.detail(invoiceId),
        queryKeys.invoices.root(),
        queryKeys.invoices.communications(invoiceId),
      ]);
    },
  });
}

export function useMarkInvoiceReminder(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data?: InvoiceMarkCommunicationRequest) => {
      const res = await api.post<unknown>(
        `/invoices/${invoiceId}/mark-reminder`,
        data ?? {},
        generateIdempotencyKey(),
      );
      return parseInvoiceMarkCommunicationResponse(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.invoices.detail(invoiceId),
        queryKeys.invoices.root(),
        queryKeys.invoices.communications(invoiceId),
      ]);
    },
  });
}
