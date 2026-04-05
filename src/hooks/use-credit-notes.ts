import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { buildQueryString } from "@/lib/utils";
import type {
  CreditNote,
  CreditNoteListResponse,
  CreateCreditNoteRequest,
} from "@/types/credit-note";

export function useCreditNotes(
  params: { invoiceId?: number; page?: number; pageSize?: number } = {},
) {
  const { invoiceId, page, pageSize } = params;

  const limit = invoiceId ? undefined : pageSize;
  const offset = invoiceId
    ? undefined
    : page != null && pageSize != null
      ? (page - 1) * pageSize
      : undefined;

  const qs = buildQueryString({ invoiceId, limit, offset });

  return useQuery({
    queryKey: queryKeys.creditNotes.list(invoiceId, page, pageSize),
    queryFn: async () => {
      const res = await api.get<CreditNoteListResponse>(`/credit-notes?${qs}`);
      return res.data;
    },
  });
}

export function useCreditNote(creditNoteId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.creditNotes.detail(creditNoteId),
    queryFn: async () => {
      const res = await api.get<CreditNote>(`/credit-notes/${creditNoteId}`);
      return res.data;
    },
    enabled: !!creditNoteId,
  });
}

const CREDIT_NOTE_INVALIDATION_KEYS = () => [
  queryKeys.creditNotes.root(),
  queryKeys.invoices.detailPrefix(),
  queryKeys.invoices.root(),
  queryKeys.parties.ledgerPrefix(),
  queryKeys.parties.balancePrefix(),
];

export function useCreateCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCreditNoteRequest) => {
      const res = await api.post<CreditNote>("/credit-notes", data, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => invalidateQueryKeys(qc, CREDIT_NOTE_INVALIDATION_KEYS()),
  });
}

export function useFinalizeCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<CreditNote>(
        `/credit-notes/${id}/finalize`,
        undefined,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => invalidateQueryKeys(qc, CREDIT_NOTE_INVALIDATION_KEYS()),
  });
}

export function useDeleteCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/credit-notes/${id}`);
    },
    onSuccess: () => invalidateQueryKeys(qc, CREDIT_NOTE_INVALIDATION_KEYS()),
  });
}
