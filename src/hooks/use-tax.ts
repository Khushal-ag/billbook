import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GSTSummaryData, GSTItemizedData } from "@/types/tax";

export function useGSTSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["tax", "gst-summary", startDate, endDate],
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
    queryKey: ["tax", "itemized", startDate, endDate],
    queryFn: async () => {
      const res = await api.get<GSTItemizedData>(
        `/tax/itemized-report?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}
