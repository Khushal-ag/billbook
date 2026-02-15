import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { CreditNote, CreateCreditNoteRequest } from "@/types/credit-note";
import type { PaginatedResponse } from "@/types/api";

export function useCreditNotes(
  params: { page?: number; pageSize?: number } = {},
) {
  const { page = 1, pageSize = 20 } = params;
  const qs = buildQueryString({ page, pageSize });

  return useQuery({
    queryKey: ["credit-notes", page, pageSize],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<CreditNote>>(
        `/credit-notes?${qs}`,
      );
      return res.data;
    },
  });
}

export function useCreateCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCreditNoteRequest) => {
      const res = await api.post<CreditNote>("/credit-notes", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-notes"] }),
  });
}

export function useFinalizeCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<CreditNote>(`/credit-notes/${id}/finalize`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-notes"] }),
  });
}

export function useDeleteCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/credit-notes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-notes"] }),
  });
}
