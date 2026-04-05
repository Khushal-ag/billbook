"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { queryKeys } from "@/lib/query-keys";
import type { AdminBusinessesResponse, ExtendValidityBody } from "@/types/admin";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_LIMIT = 30;

export function useAdminBusinesses(limit = DEFAULT_LIMIT, offset = 0) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.admin.businesses(limit, offset),
    queryFn: async () => {
      const res = await api.get<AdminBusinessesResponse>(
        `/admin/businesses?limit=${limit}&offset=${offset}`,
      );
      return res.data;
    },
    enabled: user?.role === "ADMIN",
  });
}

export function useExtendBusinessValidity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessId, body }: { businessId: number; body: ExtendValidityBody }) => {
      await api.patch(`/admin/businesses/${businessId}/validity`, body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
