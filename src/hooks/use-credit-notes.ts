import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { buildQueryString } from "@/lib/utils";
import type {
  CreditNote,
  CreditNoteListResponse,
  CreateCreditNoteRequest,
} from "@/types/credit-note";

export function useCreditNotes(params: { invoiceId?: number } = {}) {
  const { invoiceId } = params;
  const qs = buildQueryString({ invoiceId });

  return useQuery({
    queryKey: ["credit-notes", invoiceId],
    queryFn: async () => {
      const res = await api.get<CreditNoteListResponse>(`/credit-notes?${qs}`);
      return res.data;
    },
  });
}

export function useCreditNote(creditNoteId: number | undefined) {
  return useQuery({
    queryKey: ["credit-notes", "detail", creditNoteId],
    queryFn: async () => {
      const res = await api.get<CreditNote>(`/credit-notes/${creditNoteId}`);
      return res.data;
    },
    enabled: !!creditNoteId,
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
