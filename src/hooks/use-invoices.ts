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
  InvoiceCommunicationChannel,
  InvoiceCommunicationRequest,
  InvoiceCommunicationResponse,
  InvoiceCommunicationsSummary,
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

/** Normalize communications API (isToday → today, build latest). */
function normalizeCommunicationsSummary(
  raw: Record<string, unknown> & {
    sent?: { action?: string; channel?: string; actionDate?: string; isToday?: boolean } | null;
    reminder?: { action?: string; channel?: string; actionDate?: string; isToday?: boolean } | null;
  },
  invoiceId: number,
): InvoiceCommunicationsSummary {
  const toLatest = (s: typeof raw.sent): InvoiceCommunicationsSummary["sent"]["latest"] =>
    s
      ? {
          id: 0,
          business_id: 0,
          invoice_id: invoiceId,
          channel: (s.channel ?? null) as InvoiceCommunicationChannel | null,
          action: (s.action as "SENT" | "REMINDER") ?? "SENT",
          metadata: null,
          action_date: s.actionDate ?? "",
          created_at: "",
        }
      : null;
  return {
    invoiceId,
    sent: {
      today: raw.sent?.isToday ?? false,
      latest: toLatest(raw.sent),
    },
    reminder: {
      today: raw.reminder?.isToday ?? false,
      latest: toLatest(raw.reminder),
    },
  };
}

export function useInvoiceCommunications(invoiceId: number | undefined) {
  return useQuery({
    queryKey: ["invoice-communications", invoiceId],
    queryFn: async () => {
      const res = await api.get<InvoiceCommunicationsSummary | Record<string, unknown>>(
        `/invoices/${invoiceId}/communications`,
      );
      const data = res.data as Record<string, unknown>;
      if (data?.sent && typeof data.sent === "object" && "isToday" in (data.sent as object)) {
        return normalizeCommunicationsSummary(
          data as Parameters<typeof normalizeCommunicationsSummary>[0],
          invoiceId!,
        );
      }
      return res.data as InvoiceCommunicationsSummary;
    },
    enabled: !!invoiceId,
    retry: false,
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
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-communications", invoiceId] });
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
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-communications", invoiceId] });
    },
  });
}
