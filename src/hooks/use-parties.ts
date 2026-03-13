import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
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
  AdvancePayment,
} from "@/types/party";

export function useParties(
  params: {
    type?: string;
    includeInactive?: boolean;
    /** Search name, email, phone, gstin, address, city, state */
    search?: string;
    /** Max 200 */
    limit?: number;
    offset?: number;
  } = {},
) {
  const { type, includeInactive, search, limit, offset } = params;

  return useQuery({
    queryKey: ["parties", type, includeInactive, search, limit, offset],
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
    onSuccess: () => invalidateQueryKeys(qc, [["parties"]]),
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
      invalidateQueryKeys(qc, [["parties"], ["party", id]]);
    },
  });
}

export function usePartyLedger(partyId: number | undefined) {
  return useQuery({
    queryKey: ["party-ledger", partyId],
    queryFn: async () => {
      const res = await api.get<PartyLedgerResponse>(`/parties/${partyId}/ledger`);
      return res.data;
    },
    enabled: !!partyId,
  });
}

export function usePartyBalance(partyId: number | undefined) {
  return useQuery({
    queryKey: ["party-balance", partyId],
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
    queryKey: ["party-statement", partyId, format, startDate, endDate],
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
      const res = await api.post<AdvancePayment>(
        `/parties/${partyId}/payments`,
        data,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [["party-ledger", partyId], ["party-balance", partyId], ["parties"]]);
    },
  });
}
