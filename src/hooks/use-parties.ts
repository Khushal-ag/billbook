import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { invalidateQueryKeys } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import { buildQueryString } from "@/lib/core/utils";
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
  PartyConsignee,
  PartyConsigneesListResponse,
  CreatePartyConsigneeRequest,
  UpdatePartyConsigneeRequest,
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
  const normalizedSearch = search?.trim() || undefined;
  const normalizedLimit = limit != null ? Math.min(200, limit) : undefined;

  return useQuery({
    queryKey: queryKeys.parties.list({
      type,
      includeInactive,
      search: normalizedSearch,
      limit: normalizedLimit,
      offset,
    }),
    queryFn: async () => {
      const qs = buildQueryString({
        type,
        includeInactive: includeInactive ? "true" : undefined,
        search: normalizedSearch,
        limit: normalizedLimit,
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

export function useParty(id: number | undefined, options?: { enabled?: boolean }) {
  const extraEnabled = options?.enabled;
  return useQuery({
    queryKey: queryKeys.parties.detail(id),
    queryFn: async () => {
      const res = await api.get<Party>(`/parties/${id}`);
      return res.data;
    },
    enabled: !!id && (extraEnabled ?? true),
  });
}

/** GET /parties/:partyId/consignees — for a lightweight addresses list without full party. */
export function usePartyConsignees(partyId: number | undefined, options?: { enabled?: boolean }) {
  const extraEnabled = options?.enabled;
  return useQuery({
    queryKey: queryKeys.parties.consignees(partyId),
    queryFn: async () => {
      const res = await api.get<PartyConsigneesListResponse>(`/parties/${partyId}/consignees`);
      return res.data.consignees;
    },
    enabled: !!partyId && (extraEnabled ?? true),
  });
}

export function useCreatePartyConsignee(partyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePartyConsigneeRequest) => {
      const res = await api.post<PartyConsignee>(
        `/parties/${partyId}/consignees`,
        data,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.parties.detail(partyId),
        queryKeys.parties.consignees(partyId),
      ]);
    },
  });
}

export function useUpdatePartyConsignee(partyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consigneeId,
      data,
    }: {
      consigneeId: number;
      data: UpdatePartyConsigneeRequest;
    }) => {
      const res = await api.put<PartyConsignee>(
        `/parties/${partyId}/consignees/${consigneeId}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.parties.detail(partyId),
        queryKeys.parties.consignees(partyId),
      ]);
    },
  });
}

export function useDeletePartyConsignee(partyId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (consigneeId: number) => {
      await api.delete(`/parties/${partyId}/consignees/${consigneeId}`);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.parties.detail(partyId),
        queryKeys.parties.consignees(partyId),
      ]);
    },
  });
}

export function useCreateParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePartyRequest) => {
      const res = await api.post<Party>("/parties", data, generateIdempotencyKey());
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        queryKeys.parties.root(),
        /** Opening balance (e.g. customer advance) may create an implicit receipt. */
        queryKeys.receipts.root(),
        queryKeys.receipts.detailPrefix(),
      ]);
    },
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
      invalidateQueryKeys(qc, [
        queryKeys.parties.root(),
        queryKeys.parties.detail(id),
        queryKeys.parties.ledger(id),
        queryKeys.parties.balance(id),
        /** First-time or changed opening balance can create or adjust a receipt. */
        queryKeys.receipts.root(),
        queryKeys.receipts.detailPrefix(),
      ]);
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
      qc.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "party-statement" && key[1] === partyId;
        },
      });
    },
  });
}
