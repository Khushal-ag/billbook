"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { queryKeys } from "@/lib/query/keys";
import { buildQueryString } from "@/lib/core/utils";
import type { AdminTransactionsData } from "@/types/admin";
import { useAuth } from "@/contexts/AuthContext";

export type AdminTransactionsQueryParams = {
  startDate: string;
  endDate: string;
  limit: number;
  offset: number;
  businessId?: number;
  /** Set false when local filters (e.g. invalid optional business id) should block the request */
  queryEnabled?: boolean;
};

export function useAdminTransactions(params: AdminTransactionsQueryParams) {
  const { user } = useAuth();
  const { startDate, endDate, limit, offset, businessId, queryEnabled = true } = params;

  return useQuery({
    queryKey: queryKeys.admin.transactions(startDate, endDate, limit, offset, businessId),
    queryFn: async () => {
      const qs = buildQueryString({
        startDate,
        endDate,
        limit,
        offset,
        ...(businessId != null && businessId > 0 ? { businessId } : {}),
      });
      const res = await api.get<AdminTransactionsData>(`/admin/transactions?${qs}`);
      return res.data;
    },
    enabled: user?.role === "ADMIN" && !!startDate && !!endDate && queryEnabled,
  });
}
