import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type {
  SalesReportData,
  PartyOutstandingData,
  ProductSalesData,
  ExportData,
} from "@/types/report";

export function useSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "sales", startDate, endDate],
    queryFn: async () => {
      const res = await api.get<SalesReportData>(
        `/reports/sales?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function usePartyOutstandingReport() {
  return useQuery({
    queryKey: ["reports", "party-outstanding"],
    queryFn: async () => {
      const res = await api.get<PartyOutstandingData>("/reports/party-outstanding");
      return res.data;
    },
  });
}

export function useProductSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "product-sales", startDate, endDate],
    queryFn: async () => {
      const res = await api.get<ProductSalesData>(
        `/reports/product-sales?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useSalesExport(startDate: string, endDate: string, enabled = false) {
  return useQuery({
    queryKey: ["reports", "sales-export", startDate, endDate],
    queryFn: async () => {
      const res = await api.get<ExportData>(
        `/reports/sales/export?startDate=${startDate}&endDate=${endDate}`,
      );
      return res.data;
    },
    enabled,
  });
}
