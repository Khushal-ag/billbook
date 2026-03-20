import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { buildQueryString } from "@/lib/utils";
import type {
  ReceiptDetail,
  ReceiptListResponse,
  CreateReceiptRequest,
  PutReceiptAllocationsRequest,
} from "@/types/receipt";

export function useReceipts(params: { page?: number; pageSize?: number; partyId?: number }) {
  const { page = 1, pageSize = 20, partyId } = params;
  const qs = buildQueryString({ page, pageSize, partyId });

  return useQuery({
    queryKey: ["receipts", page, pageSize, partyId],
    queryFn: async () => {
      const res = await api.get<ReceiptListResponse>(`/receipts?${qs}`);
      return res.data;
    },
  });
}

export function useReceipt(receiptId: number | undefined) {
  return useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: async () => {
      const res = await api.get<ReceiptDetail>(`/receipts/${receiptId}`);
      return res.data;
    },
    enabled: !!receiptId,
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateReceiptRequest) => {
      const res = await api.post<ReceiptDetail>("/receipts", body, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        ["receipts"],
        ["receipt"],
        ["party-ledger"],
        ["party-balance"],
        ["invoice"],
      ]);
    },
  });
}

export function useUpdateReceiptAllocations(receiptId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PutReceiptAllocationsRequest) => {
      const res = await api.put<ReceiptDetail>(`/receipts/${receiptId}/allocations`, body);
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        ["receipt", receiptId],
        ["receipts"],
        ["invoice"],
        ["invoices"],
        ["party-ledger"],
        ["party-balance"],
      ]);
    },
  });
}
