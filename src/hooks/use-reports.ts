import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type {
  SalesReportData,
  PartyOutstandingData,
  ItemSalesData,
  ItemSalesRow,
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

type ItemSalesRaw = ItemSalesData & {
  products?: Array<{
    productId?: number;
    itemId?: number;
    productName?: string;
    itemName?: string;
    unit?: string;
    totalQuantity?: string;
    totalAmount?: string;
    avgPrice?: string;
  }>;
};

export function useItemSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "item-sales", startDate, endDate],
    queryFn: async () => {
      const res = await api.get<ItemSalesRaw>(
        `/reports/item-sales?startDate=${startDate}&endDate=${endDate}`,
      );
      const data = res.data;
      const rawItems = Array.isArray(data.items) ? data.items : (data.products ?? []);
      const items: ItemSalesRow[] = rawItems.map((r) => ({
        itemId: (r as ItemSalesRow).itemId ?? (r as { productId?: number }).productId ?? 0,
        itemName: (r as ItemSalesRow).itemName ?? (r as { productName?: string }).productName ?? "",
        unit: (r as ItemSalesRow).unit ?? "",
        totalQuantity: (r as ItemSalesRow).totalQuantity ?? "",
        totalAmount: (r as ItemSalesRow).totalAmount ?? "",
        avgPrice: (r as ItemSalesRow).avgPrice ?? "",
      }));
      const summary = data.summary ?? { totalItems: 0, totalQuantity: "0", totalAmount: "0" };
      return { period: data.period, items, summary } as ItemSalesData;
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
