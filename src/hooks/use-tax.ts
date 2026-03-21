import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { queryKeys } from "@/lib/query-keys";
import type { GSTSummaryData, GSTItemizedData, GSTExportData } from "@/types/tax";

export function useGSTSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.tax.gstSummary(startDate, endDate),
    queryFn: async () => {
      const res = await api.get<GSTSummaryData>(
        `/tax/gst-summary?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useGSTItemized(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.tax.itemized(startDate, endDate),
    queryFn: async () => {
      const res = await api.get<GSTItemizedData>(
        `/tax/itemized-report?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useGSTExport(startDate: string, endDate: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.tax.gstExport(startDate, endDate),
    queryFn: async () => {
      const res = await api.get<GSTExportData>(
        `/tax/gst/export?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled,
  });
}
