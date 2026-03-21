import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import type { Category, ItemType, Unit } from "@/types/item";

const ITEMS_BASE = "/items";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.items.categories(),
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
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.items.categories()]),
  });
}

export interface UnitsResponse {
  units: Unit[];
  count?: number;
}

export function useUnits(type?: ItemType) {
  const query = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: queryKeys.items.units(type),
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
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.items.unitsRoot()]),
  });
}
