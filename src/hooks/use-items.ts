import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { normalizeItemType } from "@/types/item";
import type {
  Category,
  Item,
  ItemDetail,
  ItemListResponse,
  CreateItemRequest,
  StockEntry,
  StockEntryListResponse,
  CreateStockEntryRequest,
  UpdateStockEntryRequest,
  StockListResponse,
  ItemLedgerResponse,
  AdjustStockRequest,
  Unit,
  ItemType,
} from "@/types/item";

const ITEMS_BASE = "/items";

function normalizeItem(item: Item): Item {
  return {
    ...item,
    type: normalizeItemType(item.type),
  };
}

function normalizeStockEntry(entry: StockEntry): StockEntry {
  return {
    ...entry,
    itemType: entry.itemType ? normalizeItemType(entry.itemType) : entry.itemType,
  };
}

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

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await api.post<Category>(`${ITEMS_BASE}/categories`, data);
      return res.data;
    },
    onSuccess: () => invalidateQueryKeys(qc, [["items", "categories"]]),
  });
}

export interface UnitsResponse {
  units: Unit[];
  count?: number;
}

export function useUnits(type?: ItemType) {
  const query = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: ["items", "units", type],
    queryFn: async () => {
      const res = await api.get<UnitsResponse | { data?: UnitsResponse }>(
        `${ITEMS_BASE}/units${query}`,
      );
      const body = res.data;
      const data =
        body && typeof body === "object" && "data" in body
          ? (body as { data: UnitsResponse }).data
          : (body as UnitsResponse);
      return Array.isArray(data?.units) ? data.units : [];
    },
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { value: string; label: string; type: ItemType }) => {
      const res = await api.post<{ data?: Unit } | Unit>(`${ITEMS_BASE}/units`, data);
      const body = res.data;
      const unit =
        body && typeof body === "object" && body !== null && "data" in body
          ? (body as { data: Unit }).data
          : (body as Unit);
      return unit;
    },
    onSuccess: () => invalidateQueryKeys(qc, [["items", "units"]]),
  });
}

export function useItems(
  params?: {
    categoryId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  },
  options?: { enabled?: boolean; staleTime?: number },
) {
  const qs = new URLSearchParams();
  if (params?.categoryId != null) qs.set("categoryId", String(params.categoryId));
  if (params?.search) qs.set("search", params.search);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  if (params?.includeInactive) qs.set("includeInactive", "true");
  const query = qs.toString();

  return useQuery({
    queryKey: [
      "items",
      "list",
      params?.categoryId ?? "",
      params?.search ?? "",
      params?.limit ?? "",
      params?.offset ?? "",
      Boolean(params?.includeInactive),
    ],
    queryFn: async () => {
      const res = await api.get<ItemListResponse>(`${ITEMS_BASE}${query ? `?${query}` : ""}`);
      return {
        ...res.data,
        items: (res.data.items ?? []).map(normalizeItem),
      };
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
  });
}

export function useItem(id: number | undefined) {
  return useQuery({
    queryKey: ["items", "item", id],
    queryFn: async () => {
      const res = await api.get<ItemDetail>(`${ITEMS_BASE}/${id}`);
      return normalizeItem(res.data) as ItemDetail;
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemRequest) => {
      const res = await api.post<Item>(ITEMS_BASE, data);
      return normalizeItem(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [["items"]]);
    },
  });
}

export function useUpdateItem(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateItemRequest>) => {
      const res = await api.put<Item>(`${ITEMS_BASE}/${id}`, data);
      return normalizeItem(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [["items"], ["items", "item", id]]);
    },
  });
}

export function useSetItemActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const res = await api.put<Item>(`${ITEMS_BASE}/${data.id}`, { isActive: data.isActive });
      return normalizeItem(res.data);
    },
    onMutate: async (vars) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["items", "list"] }),
        qc.cancelQueries({ queryKey: ["items", "item", vars.id] }),
      ]);

      // Snapshot current caches for rollback
      const prevLists = qc.getQueriesData<ItemListResponse>({ queryKey: ["items", "list"] });
      const prevItem = qc.getQueryData<ItemDetail>(["items", "item", vars.id]);

      // Optimistically update list caches
      qc.setQueriesData<ItemListResponse>({ queryKey: ["items", "list"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: (old.items ?? []).map((it) =>
            it.id === vars.id ? { ...it, isActive: vars.isActive } : it,
          ),
        };
      });

      // Optimistically update detail cache (if present)
      qc.setQueryData<ItemDetail>(["items", "item", vars.id], (old) =>
        old ? { ...old, isActive: vars.isActive } : old,
      );

      return { prevLists, prevItem };
    },
    onError: (_err, vars, ctx) => {
      // Roll back list caches
      if (ctx?.prevLists) {
        for (const [key, data] of ctx.prevLists) {
          qc.setQueryData(key, data);
        }
      }
      // Roll back detail cache
      if (ctx?.prevItem) {
        qc.setQueryData(["items", "item", vars.id], ctx.prevItem);
      }
    },
    onSuccess: (_item, vars) => {
      invalidateQueryKeys(qc, [["items"], ["items", "item", vars.id]]);
    },
  });
}

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
      ? (["items", "stock-entries", "by-item", itemId, query] as const)
      : ([
          "items",
          "stock-entries",
          "list",
          params?.categoryId ?? "",
          params?.search ?? "",
          params?.limit ?? 100,
          params?.offset ?? 0,
        ] as const);

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
    queryKey: ["items", "stock-entry", entryId],
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
    queryKey: ["items", "stock-entry-map", uniqueEntryIds],
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
      invalidateQueryKeys(qc, [["items", "stock-entries"], ["items", "stock"], ["items"]]);
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
    onSuccess: (_entry) => {
      invalidateQueryKeys(qc, [["items", "stock-entries"], ["items", "stock"], ["items"]]);
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
    queryKey: ["items", "stock", params],
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
        ["items"],
        ["items", "item", itemId],
        ["items", "stock"],
        ["items", "stock-entries"],
        ["items", "ledger", itemId],
      ]);
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
