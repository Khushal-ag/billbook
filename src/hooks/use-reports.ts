import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { queryKeys } from "@/lib/query/keys";
import { buildQueryString } from "@/lib/core/utils";
import type {
  ReportsDashboardData,
  ReceiptRegisterData,
  InvoiceRegisterData,
  DebtRegisterData,
  PayablesRegisterData,
  ReceivablesAgingData,
  CreditNoteRegisterData,
  PayoutRegisterData,
} from "@/types/report";
import type { InvoiceType } from "@/types/invoice";
import { normalizeReceiptRegisterData } from "@/lib/reports/receipt-register-normalize";

export function useReportsDashboard(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.reports.dashboard(startDate, endDate),
    queryFn: async () => {
      const qs = buildQueryString({ startDate, endDate });
      const res = await api.get<ReportsDashboardData>(`/reports/dashboard?${qs}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useReceiptRegister(startDate: string, endDate: string, limit: number) {
  return useQuery({
    queryKey: queryKeys.reports.receiptRegister(startDate, endDate, limit),
    queryFn: async () => {
      const qs = buildQueryString({ startDate, endDate, limit });
      const res = await api.get<ReceiptRegisterData>(`/reports/receipt-register?${qs}`);
      return normalizeReceiptRegisterData(res.data as unknown);
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useInvoiceRegister(
  startDate: string,
  endDate: string,
  limit: number,
  invoiceType?: InvoiceType,
) {
  return useQuery({
    queryKey: queryKeys.reports.invoiceRegister(startDate, endDate, limit, invoiceType),
    queryFn: async () => {
      const qs = buildQueryString({ startDate, endDate, limit, invoiceType });
      const res = await api.get<InvoiceRegisterData>(`/reports/invoice-register?${qs}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useDebtRegister(limit: number) {
  return useQuery({
    queryKey: queryKeys.reports.debtRegister(limit),
    queryFn: async () => {
      const qs = buildQueryString({ limit });
      const res = await api.get<DebtRegisterData>(`/reports/debt-register?${qs}`);
      return res.data;
    },
  });
}

export function usePayablesRegister(limit: number) {
  return useQuery({
    queryKey: queryKeys.reports.payablesRegister(limit),
    queryFn: async () => {
      const qs = buildQueryString({ limit });
      const res = await api.get<PayablesRegisterData>(`/reports/payables-register?${qs}`);
      return res.data;
    },
  });
}

export function useReceivablesAging(asOf: string, limit: number) {
  return useQuery({
    queryKey: queryKeys.reports.receivablesAging(asOf, limit),
    queryFn: async () => {
      const qs = buildQueryString({ asOf, limit });
      const res = await api.get<ReceivablesAgingData>(`/reports/receivables-aging?${qs}`);
      return res.data;
    },
    enabled: !!asOf,
  });
}

export function useCreditNoteRegister(startDate: string, endDate: string, limit: number) {
  return useQuery({
    queryKey: queryKeys.reports.creditNoteRegister(startDate, endDate, limit),
    queryFn: async () => {
      const qs = buildQueryString({ startDate, endDate, limit });
      const res = await api.get<CreditNoteRegisterData>(`/reports/credit-note-register?${qs}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function usePayoutRegister(startDate: string, endDate: string, limit: number) {
  return useQuery({
    queryKey: queryKeys.reports.payoutRegister(startDate, endDate, limit),
    queryFn: async () => {
      const qs = buildQueryString({ startDate, endDate, limit });
      const res = await api.get<PayoutRegisterData>(`/reports/payout-register?${qs}`);
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}
