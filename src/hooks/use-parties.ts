import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
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
} from "@/types/party";

export function useParties(params: { type?: string } = {}) {
  const { type } = params;

  return useQuery({
    queryKey: ["parties", type],
    queryFn: async () => {
      const res = await api.get<PartyListResponse>("/parties");
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
      const res = await api.post<{ invoiceId: number | null }>(
        `/parties/${partyId}/payments`,
        data,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["party-ledger", partyId] });
      qc.invalidateQueries({ queryKey: ["party-balance", partyId] });
      qc.invalidateQueries({ queryKey: ["parties"] });
    },
  });
}
