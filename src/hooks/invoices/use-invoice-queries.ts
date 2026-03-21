import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { ApiClientError } from "@/api/error";
import { queryKeys } from "@/lib/query-keys";
import { buildQueryString } from "@/lib/utils";
import type {
  InvoiceDetail,
  InvoiceListResponse,
  InvoiceType,
  InvoicePdfResponse,
  InvoiceCommunicationsSummary,
  NextInvoiceNumberData,
} from "@/types/invoice";
import { normalizeCommunicationsSummary } from "./invoice-helpers";

export type UseNextInvoiceNumberOptions = {
  invoiceDate?: string;
  financialYear?: string;
  enabled?: boolean;
};

export function useNextInvoiceNumber(options?: UseNextInvoiceNumberOptions) {
  const invoiceDate = options?.invoiceDate?.trim() || undefined;
  const financialYear = options?.financialYear?.trim() || undefined;

  return useQuery({
    enabled: options?.enabled !== false,
    queryKey: queryKeys.invoices.nextNumber(invoiceDate ?? "", financialYear ?? ""),
    queryFn: async () => {
      const qs = buildQueryString({
        invoiceDate,
        financialYear,
      });
      const path = qs ? `/invoices/next-number?${qs}` : "/invoices/next-number";
      const res = await api.get<NextInvoiceNumberData>(path);
      const next = res.data?.nextNumber;
      if (typeof next === "string" && next.trim()) return next.trim();
      throw new ApiClientError("Next invoice number not returned", 500);
    },
  });
}

export function useInvoices(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  invoiceType?: InvoiceType;
  partyId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    search,
    invoiceType,
    partyId,
    startDate,
    endDate,
  } = params;
  const hasDateRange = Boolean(startDate && endDate);
  const queryStartDate = hasDateRange ? startDate : undefined;
  const queryEndDate = hasDateRange ? endDate : undefined;

  const qs = buildQueryString({
    page,
    pageSize,
    status: status !== "ALL" ? status : undefined,
    search: search?.trim() || undefined,
    invoiceType,
    partyId,
    startDate: queryStartDate,
    endDate: queryEndDate,
  });

  return useQuery({
    queryKey: queryKeys.invoices.list({
      page,
      pageSize,
      status,
      search,
      invoiceType,
      partyId,
      queryStartDate,
      queryEndDate,
    }),
    queryFn: async () => {
      const res = await api.get<InvoiceListResponse>(`/invoices?${qs}`);
      return res.data;
    },
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: async () => {
      const res = await api.get<InvoiceDetail>(`/invoices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useInvoicePdf(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.pdf(id),
    queryFn: async () => {
      const res = await api.get<InvoicePdfResponse>(`/invoices/${id}/pdf`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useInvoiceCommunications(invoiceId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.invoices.communications(invoiceId),
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
