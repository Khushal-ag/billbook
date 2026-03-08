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
  UpdateStockEntryRequest,
  StockListResponse,
  ItemLedgerResponse,
  AdjustStockRequest,
  Unit,
  ItemType,
} from "@/types/item";

const ITEMS_BASE = "/items";

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", "categories"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", "units"] }),
  });
}

export function useItems(params?: {
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.categoryId != null) qs.set("categoryId", String(params.categoryId));
  if (params?.search) qs.set("search", params.search);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  if (params?.includeInactive) qs.set("includeInactive", "true");
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

export function useSetItemActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const res = await api.put<Item>(`${ITEMS_BASE}/${data.id}`, { isActive: data.isActive });
      return res.data;
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
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["items", "item", vars.id] });
    },
  });
}

/** GET /items/stock-entries (and GET /items/:itemId/stock-entries) include SERVICE entries. */
export function useStockEntries(params?: {
  itemId?: number;
  categoryId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
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

  return useQuery({
    queryKey: ["items", "stock-entries", itemId ?? params],
    queryFn: async () => {
      const res = await api.get<StockEntryListResponse>(url);
      return res.data;
    },
  });
}

export function useStockEntry(entryId: number | undefined) {
  return useQuery({
    queryKey: ["items", "stock-entry", entryId],
    queryFn: async () => {
      const res = await api.get<StockEntry>(`${ITEMS_BASE}/stock-entries/${entryId}`);
      return res.data;
    },
    enabled: !!entryId,
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
      qc.invalidateQueries({ queryKey: ["items", "stock"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateStockEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, data }: { entryId: number; data: UpdateStockEntryRequest }) => {
      const res = await api.put<StockEntry>(`${ITEMS_BASE}/stock-entries/${entryId}`, data);
      return res.data;
    },
    onSuccess: (_entry) => {
      qc.invalidateQueries({ queryKey: ["items", "stock-entries"] });
      qc.invalidateQueries({ queryKey: ["items", "stock"] });
      qc.invalidateQueries({ queryKey: ["items"] });
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
      return res.data;
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
      qc.invalidateQueries({ queryKey: ["items", "stock"] });
      qc.invalidateQueries({ queryKey: ["items", "stock-entries"] });
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
