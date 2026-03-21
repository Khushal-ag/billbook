import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { buildQueryString } from "@/lib/utils";
import type {
  OutboundPaymentListResponse,
  OutboundPayment,
  CreateOutboundPaymentRequest,
  OutboundPaymentCategory,
} from "@/types/outbound-payment";

export function useOutboundPayments(params: {
  page?: number;
  pageSize?: number;
  category?: OutboundPaymentCategory | "ALL";
  partyId?: number;
}) {
  const { page = 1, pageSize = 20, category, partyId } = params;
  const qs = buildQueryString({
    page,
    pageSize,
    category: category && category !== "ALL" ? category : undefined,
    partyId,
  });

  return useQuery({
    queryKey: queryKeys.outboundPayments.list(page, pageSize, category, partyId),
    queryFn: async () => {
      const res = await api.get<OutboundPaymentListResponse>(`/payments/outbound?${qs}`);
      return res.data;
    },
  });
}

export function useCreateOutboundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateOutboundPaymentRequest) => {
      const res = await api.post<OutboundPayment>(
        "/payments/outbound",
        body,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.outboundPayments.root(),
        queryKeys.parties.ledgerPrefix(),
        queryKeys.parties.balancePrefix(),
        queryKeys.invoices.detailPrefix(),
        queryKeys.invoices.root(),
      ]);
    },
  });
}
