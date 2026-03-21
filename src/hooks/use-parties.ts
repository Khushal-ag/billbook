import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { buildQueryString } from "@/lib/utils";
import type {
  Party,
  PartyListResponse,
  CreatePartyRequest,
  PartyLedgerResponse,
  PartyBalanceResponse,
  PartyStatementResponse,
  PartyStatementPdfResponse,
  PartyAdvancePaymentRequest,
  PartyAdvanceReceiptResult,
  PartyType,
} from "@/types/party";

export function useParties(
  params: {
    type?: PartyType;
    includeInactive?: boolean;
    /** Search name, email, phone, gstin, address, city, state */
    search?: string;
    /** Max 200 */
    limit?: number;
    offset?: number;
  } = {},
  options?: { enabled?: boolean; keepPreviousData?: boolean },
) {
  const { type, includeInactive, search, limit, offset } = params;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.parties.list({ type, includeInactive, search, limit, offset }),
    queryFn: async () => {
      const qs = buildQueryString({
        type,
        includeInactive: includeInactive ? "true" : undefined,
        search: search?.trim() || undefined,
        limit: limit != null ? Math.min(200, limit) : undefined,
        offset,
      });
      const res = await api.get<PartyListResponse>(`/parties${qs ? `?${qs}` : ""}`);
      return res.data;
    },
    enabled,
    placeholderData: options?.keepPreviousData
      ? (previousData: PartyListResponse | undefined) => previousData
      : undefined,
  });
}

export function useParty(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.parties.detail(id),
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
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.parties.root()]),
  });
}

export function useUpdateParty(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CreatePartyRequest> & { isActive?: boolean }) => {
      const res = await api.put<Party>(`/parties/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.parties.root(), queryKeys.parties.detail(id)]);
    },
  });
}

export function usePartyLedger(partyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.parties.ledger(partyId),
    queryFn: async () => {
      const res = await api.get<PartyLedgerResponse>(`/parties/${partyId}/ledger`);
      return res.data;
    },
    enabled: !!partyId,
  });
}

export function usePartyBalance(partyId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.parties.balance(partyId),
    queryFn: async () => {
      const res = await api.get<PartyBalanceResponse>(`/parties/${partyId}/balance`);
      return res.data;
    },
    enabled: !!partyId,
  });
}

export function usePartyStatement(params: {
  partyId: number | undefined;
  format?: "json" | "pdf";
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) {
  const { partyId, format = "json", startDate, endDate, enabled = true } = params;
  const qs = buildQueryString({ format, startDate, endDate });

  return useQuery({
    queryKey: queryKeys.parties.statement(partyId, format, startDate, endDate),
    queryFn: async () => {
      const res = await api.get<PartyStatementResponse | PartyStatementPdfResponse>(
        `/parties/${partyId}/statement?${qs}`,
      );
      return res.data;
    },
    enabled: !!partyId && enabled,
  });
}

export function useRecordPartyAdvancePayment(partyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PartyAdvancePaymentRequest) => {
      const res = await api.post<PartyAdvanceReceiptResult>(
        `/parties/${partyId}/payments`,
        data,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.parties.ledger(partyId),
        queryKeys.parties.balance(partyId),
        queryKeys.parties.root(),
        queryKeys.receipts.root(),
      ]);
    },
  });
}
