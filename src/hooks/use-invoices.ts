import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { buildQueryString } from "@/lib/utils";
import type {
  Invoice,
  InvoiceDetail,
  InvoiceListResponse,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  RecordPaymentRequest,
  InvoicePdfResponse,
  FinalizeInvoiceResponse,
  Payment,
} from "@/types/invoice";

export function useInvoices(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { page = 1, pageSize = 20, status, startDate, endDate } = params;
  const qs = buildQueryString({
    page,
    pageSize,
    status: status !== "ALL" ? status : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return useQuery({
    queryKey: ["invoices", page, pageSize, status, startDate, endDate],
    queryFn: async () => {
      const res = await api.get<InvoiceListResponse>(`/invoices?${qs}`);
      return res.data;
    },
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await api.get<InvoiceDetail>(`/invoices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const res = await api.post<Invoice>("/invoices", data, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
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
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
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
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/invoices/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useRecordPayment(invoiceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: RecordPaymentRequest) => {
      const res = await api.post<Payment>(`/invoices/${invoiceId}/payments`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useInvoicePdf(id: number | undefined) {
  return useQuery({
    queryKey: ["invoice-pdf", id],
    queryFn: async () => {
      const res = await api.get<InvoicePdfResponse>(`/invoices/${id}/pdf`);
      return res.data;
    },
    enabled: !!id,
  });
}
