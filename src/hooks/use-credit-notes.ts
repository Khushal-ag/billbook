import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { buildQueryString } from "@/lib/utils";
import type {
  CreditNoteDetail,
  CreditNoteListResponse,
  CreateCreditNoteRequest,
  PutCreditNoteAllocationsRequest,
} from "@/types/credit-note";

export function useCreditNotes(
  params: { invoiceId?: number; page?: number; pageSize?: number; enabled?: boolean } = {},
) {
  const { invoiceId, page, pageSize, enabled = true } = params;

  const limit = invoiceId ? undefined : pageSize;
  const offset = invoiceId
    ? undefined
    : page != null && pageSize != null
      ? (page - 1) * pageSize
      : undefined;

  const qs = buildQueryString({ invoiceId, limit, offset });

  return useQuery({
    enabled,
    queryKey: queryKeys.creditNotes.list(invoiceId, page, pageSize),
    queryFn: async () => {
      const res = await api.get<CreditNoteListResponse>(`/credit-notes?${qs}`);
      return res.data;
    },
  });
}

function normalizeCreditNoteDetail(raw: CreditNoteDetail): CreditNoteDetail {
  const allocations = raw.allocations ?? [];
  const fromLines = allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const allocatedAmount = raw.allocatedAmount ?? fromLines.toFixed(2);
  const allocNum = parseFloat(allocatedAmount) || 0;
  const unallocatedAmount =
    raw.unallocatedAmount ??
    (() => {
      const total = parseFloat(raw.amount) || 0;
      return Math.max(0, total - allocNum).toFixed(2);
    })();
  return {
    ...raw,
    allocations,
    openInvoicesForParty: raw.openInvoicesForParty ?? [],
    allocatedAmount,
    unallocatedAmount,
  };
}

export function useCreditNote(creditNoteId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.creditNotes.detail(creditNoteId),
    queryFn: async () => {
      const res = await api.get<CreditNoteDetail>(`/credit-notes/${creditNoteId}`);
      return normalizeCreditNoteDetail(res.data);
    },
    enabled: !!creditNoteId,
  });
}

/** Invoices, receipts (open invoice lists), & party balances affected by credit notes */
const CREDIT_NOTE_RELATED_KEYS = () => [
  queryKeys.invoices.detailPrefix(),
  queryKeys.invoices.root(),
  queryKeys.receipts.root(),
  queryKeys.receipts.detailPrefix(),
  queryKeys.parties.ledgerPrefix(),
  queryKeys.parties.balancePrefix(),
];

/**
 * List + detail credit-note queries go inactive while viewing a single note. Default
 * invalidateQueries only refetches active queries, so the list stayed stale until staleTime
 * elapsed. refetchType "all" refreshes inactive list caches too (e.g. after allocate).
 */
async function invalidateCreditNoteCaches(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.creditNotes.root(),
    refetchType: "all",
  });
  invalidateQueryKeys(queryClient, CREDIT_NOTE_RELATED_KEYS());
}

export function useCreateCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCreditNoteRequest) => {
      const res = await api.post<CreditNoteDetail>("/credit-notes", data, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => void invalidateCreditNoteCaches(qc),
  });
}

export function useUpdateCreditNoteAllocations(creditNoteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PutCreditNoteAllocationsRequest) => {
      const res = await api.put<CreditNoteDetail>(
        `/credit-notes/${creditNoteId}/allocations`,
        body,
      );
      return res.data;
    },
    onSuccess: () => void invalidateCreditNoteCaches(qc),
  });
}

export function useDeleteCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/credit-notes/${id}`);
    },
    onSuccess: () => void invalidateCreditNoteCaches(qc),
  });
}
