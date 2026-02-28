import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type {
  Category,
  Item,
  ItemDetail,
  ItemListResponse,
  CreateItemRequest,
  StockEntry,
  StockEntryListResponse,
  CreateStockEntryRequest,
  StockReportResponse,
  ItemLedgerResponse,
  AdjustStockRequest,
} from "@/types/item";

const ITEMS_BASE = "/items";

// —— Categories ——
export function useCategories() {
  return useQuery({
    queryKey: ["items", "categories"],
    queryFn: async () => {
      const res = await api.get<Category[] | { categories?: Category[] }>(
        `${ITEMS_BASE}/categories`,
      );
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (
        data &&
        typeof data === "object" &&
        Array.isArray((data as { categories?: Category[] }).categories)
      ) {
        return (data as { categories: Category[] }).categories;
      }
      return [];
    },
  });
}

export function useCategory(id: number | undefined) {
  return useQuery({
    queryKey: ["items", "categories", id],
    queryFn: async () => {
      const res = await api.get<Category>(`${ITEMS_BASE}/categories/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await api.post<Category>(`${ITEMS_BASE}/categories`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", "categories"] }),
  });
}

export function useUpdateCategory(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await api.put<Category>(`${ITEMS_BASE}/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", "categories"] }),
  });
}

export function useDeleteCategory(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`${ITEMS_BASE}/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", "categories"] }),
  });
}

// —— Items ——
export function useItems(params?: {
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.categoryId != null) qs.set("categoryId", String(params.categoryId));
  if (params?.search) qs.set("search", params.search);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();

  return useQuery({
    queryKey: ["items", "list", params],
    queryFn: async () => {
      const res = await api.get<ItemListResponse>(`${ITEMS_BASE}${query ? `?${query}` : ""}`);
      return res.data;
    },
  });
}

export function useItem(id: number | undefined) {
  return useQuery({
    queryKey: ["items", "item", id],
    queryFn: async () => {
      const res = await api.get<ItemDetail>(`${ITEMS_BASE}/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemRequest) => {
      const res = await api.post<Item>(ITEMS_BASE, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateItem(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateItemRequest>) => {
      const res = await api.put<Item>(`${ITEMS_BASE}/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["items", "item", id] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`${ITEMS_BASE}/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

// —— Stock entries ——
export function useStockEntries(itemId?: number | undefined) {
  const path = itemId ? `${ITEMS_BASE}/${itemId}/stock-entries` : `${ITEMS_BASE}/stock-entries`;
  return useQuery({
    queryKey: ["items", "stock-entries", itemId],
    queryFn: async () => {
      const res = await api.get<StockEntry[] | StockEntryListResponse>(path);
      const data = res.data;
      if (Array.isArray(data)) return data;
      return (data as StockEntryListResponse).entries ?? [];
    },
  });
}

export function useCreateStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStockEntryRequest) => {
      const res = await api.post<StockEntry>(`${ITEMS_BASE}/stock-entries`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items", "stock-entries"] });
      qc.invalidateQueries({ queryKey: ["items", "stock-report"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

// —— Stock report & adjustments ——
export function useStockReport() {
  return useQuery({
    queryKey: ["items", "stock-report"],
    queryFn: async () => {
      const res = await api.get<StockReportResponse>(`${ITEMS_BASE}/stock/report`);
      const data = res.data;
      if (Array.isArray(data)) return data;
      return data.stock ?? data.items ?? [];
    },
  });
}

export function useAdjustStock(itemId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AdjustStockRequest) => {
      await api.post(`${ITEMS_BASE}/${itemId}/adjust-stock`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["items", "item", itemId] });
      qc.invalidateQueries({ queryKey: ["items", "stock-report"] });
      qc.invalidateQueries({ queryKey: ["items", "ledger", itemId] });
    },
  });
}

export function useItemLedger(itemId: number | undefined) {
  return useQuery({
    queryKey: ["items", "ledger", itemId],
    queryFn: async () => {
      const res = await api.get<ItemLedgerResponse>(`${ITEMS_BASE}/${itemId}/ledger`);
      return res.data.ledger ?? [];
    },
    enabled: !!itemId,
  });
}
