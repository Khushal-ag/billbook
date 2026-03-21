import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { normalizeItemType } from "@/types/item";
import type {
  StockEntry,
  StockEntryListResponse,
  CreateStockEntryRequest,
  UpdateStockEntryRequest,
  StockListResponse,
  ItemLedgerResponse,
  AdjustStockRequest,
} from "@/types/item";
import { normalizeStockEntry } from "./normalize";

const ITEMS_BASE = "/items";

/** GET /items/stock-entries (and GET /items/:itemId/stock-entries) include SERVICE entries. */
export function useStockEntries(
  params?: {
    itemId?: number;
    categoryId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  },
  options?: { enabled?: boolean; staleTime?: number },
) {
  const itemId = params?.itemId;
  const path =
    itemId != null ? `${ITEMS_BASE}/${itemId}/stock-entries` : `${ITEMS_BASE}/stock-entries`;
  const qs = itemId == null && params ? new URLSearchParams() : null;
  if (qs) {
    if (params?.categoryId != null) qs.set("categoryId", String(params.categoryId));
    if (params?.search) qs.set("search", params.search);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
  }
  const query = qs?.toString();
  const url = query ? `${path}?${query}` : path;

  const listQueryKey =
    itemId != null
      ? queryKeys.items.stockEntriesByItem(itemId, query ?? "")
      : queryKeys.items.stockEntriesList({
          categoryId: params?.categoryId,
          search: params?.search ?? "",
          limit: params?.limit ?? 100,
          offset: params?.offset ?? 0,
        });

  return useQuery({
    queryKey: [...listQueryKey],
    queryFn: async () => {
      const res = await api.get<StockEntryListResponse>(url);
      return {
        ...res.data,
        entries: (res.data.entries ?? []).map(normalizeStockEntry),
      };
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
  });
}

export function useStockEntry(entryId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.items.stockEntry(entryId),
    queryFn: async () => {
      const res = await api.get<StockEntry>(`${ITEMS_BASE}/stock-entries/${entryId}`);
      return normalizeStockEntry(res.data);
    },
    enabled: !!entryId,
  });
}

export function useStockEntriesByIds(entryIds: number[]) {
  const uniqueEntryIds = Array.from(
    new Set(entryIds.filter((entryId) => Number.isFinite(entryId))),
  );

  return useQuery({
    queryKey: queryKeys.items.stockEntryMap(uniqueEntryIds),
    queryFn: async () => {
      const entries = await Promise.all(
        uniqueEntryIds.map((entryId) => getStockEntryById(entryId)),
      );
      return entries.reduce<Record<number, StockEntry>>((accumulator, entry) => {
        accumulator[entry.id] = entry;
        return accumulator;
      }, {});
    },
    enabled: uniqueEntryIds.length > 0,
  });
}

export async function getStockEntryById(entryId: number): Promise<StockEntry> {
  const res = await api.get<StockEntry>(`${ITEMS_BASE}/stock-entries/${entryId}`);
  return normalizeStockEntry(res.data);
}

export function useCreateStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStockEntryRequest) => {
      const res = await api.post<StockEntry>(`${ITEMS_BASE}/stock-entries`, data);
      return normalizeStockEntry(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.items.stockEntriesRoot(),
        queryKeys.items.stockPrefix(),
        queryKeys.items.root(),
      ]);
    },
  });
}

export function useUpdateStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, data }: { entryId: number; data: UpdateStockEntryRequest }) => {
      const res = await api.put<StockEntry>(`${ITEMS_BASE}/stock-entries/${entryId}`, data);
      return normalizeStockEntry(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.items.stockEntriesRoot(),
        queryKeys.items.stockPrefix(),
        queryKeys.items.root(),
      ]);
    },
  });
}

/** GET /items/stock: list includes SERVICE items (0 quantity, entry count). Summary in response may aggregate both. */
export function useStockList(params?: {
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.categoryId != null) qs.set("categoryId", String(params.categoryId));
  if (params?.search) qs.set("search", params.search ?? "");
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return useQuery({
    queryKey: queryKeys.items.stockList(params ?? {}),
    queryFn: async () => {
      const res = await api.get<StockListResponse>(
        `${ITEMS_BASE}/stock${query ? `?${query}` : ""}`,
      );
      return {
        ...res.data,
        stock: (res.data.stock ?? []).map((row) => ({
          ...row,
          itemType: normalizeItemType(row.itemType),
        })),
      };
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
      invalidateQueryKeys(qc, [
        queryKeys.items.root(),
        queryKeys.items.detail(itemId),
        queryKeys.items.stockPrefix(),
        queryKeys.items.stockEntriesRoot(),
        queryKeys.items.ledger(itemId),
      ]);
    },
  });
}

export function useItemLedger(itemId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.items.ledger(itemId),
    queryFn: async () => {
      const res = await api.get<ItemLedgerResponse>(`${ITEMS_BASE}/${itemId}/ledger`);
      return res.data.ledger ?? [];
    },
    enabled: !!itemId,
  });
}
