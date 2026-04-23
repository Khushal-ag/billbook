import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import type { Item, ItemDetail, ItemListResponse, CreateItemRequest } from "@/types/item";
import { ITEMS_API_BASE, normalizeItem } from "@/lib/items/item-api";

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

  const listKey = queryKeys.items.list({
    categoryId: params?.categoryId,
    search: params?.search ?? "",
    limit: params?.limit,
    offset: params?.offset,
    includeInactive: Boolean(params?.includeInactive),
  });

  return useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const res = await api.get<ItemListResponse>(`${ITEMS_API_BASE}${query ? `?${query}` : ""}`);
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
    queryKey: queryKeys.items.detail(id),
    queryFn: async () => {
      const res = await api.get<ItemDetail>(`${ITEMS_API_BASE}/${id}`);
      return normalizeItem(res.data) as ItemDetail;
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemRequest) => {
      const res = await api.post<Item>(ITEMS_API_BASE, data);
      return normalizeItem(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.items.root()]);
    },
  });
}

export function useUpdateItem(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreateItemRequest>) => {
      const res = await api.put<Item>(`${ITEMS_API_BASE}/${id}`, data);
      return normalizeItem(res.data);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.items.root(), queryKeys.items.detail(id)]);
    },
  });
}
