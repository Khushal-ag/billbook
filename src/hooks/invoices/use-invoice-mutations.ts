import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import type {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  RecordPaymentRequest,
  FinalizeInvoiceResponse,
  InvoiceCommunicationRequest,
  InvoiceCommunicationResponse,
} from "@/types/invoice";
import { parseRecordPaymentResponse } from "./invoice-helpers";

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const res = await api.post<Invoice>("/invoices", data, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.invoices.root()]),
  });
}

export function useUpdateInvoice(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateInvoiceRequest) => {
      const res = await api.put<Invoice>(`/invoices/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.invoices.root(), queryKeys.invoices.detail(id)]);
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
      invalidateQueryKeys(qc, [queryKeys.invoices.root(), queryKeys.invoices.detail(id)]);
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
      invalidateQueryKeys(qc, [queryKeys.invoices.root(), queryKeys.invoices.detail(invoiceId)]);
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
    },
  });
}

export function useMarkInvoiceSent(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data?: InvoiceCommunicationRequest) => {
      const res = await api.post<InvoiceCommunicationResponse>(
        `/invoices/${invoiceId}/mark-sent`,
        data,
        generateIdempotencyKey(),
      );
      return res.data;
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
    mutationFn: async (data?: InvoiceCommunicationRequest) => {
      const res = await api.post<InvoiceCommunicationResponse>(
        `/invoices/${invoiceId}/mark-reminder`,
        data,
        generateIdempotencyKey(),
      );
      return res.data;
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
