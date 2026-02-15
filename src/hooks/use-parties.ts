import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { Party, CreatePartyRequest } from "@/types/party";
import type { PaginatedResponse } from "@/types/api";

export function useParties(params: { type?: string; page?: number; pageSize?: number } = {}) {
  const { type, page = 1, pageSize = 50 } = params;
  const qs = buildQueryString({ page, pageSize, type });

  return useQuery({
    queryKey: ["parties", type, page, pageSize],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Party>>(`/parties?${qs}`);
      return res.data;
    },
  });
}

export function useParty(id: number | undefined) {
  return useQuery({
    queryKey: ["party", id],
    queryFn: async () => {
      const res = await api.get<Party>(`/parties/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePartyRequest) => {
      const res = await api.post<Party>("/parties", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parties"] }),
  });
}

export function useUpdateParty(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreatePartyRequest>) => {
      const res = await api.put<Party>(`/parties/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties"] });
      qc.invalidateQueries({ queryKey: ["party", id] });
    },
  });
}

export function useDeleteParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/parties/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parties"] }),
  });
}
