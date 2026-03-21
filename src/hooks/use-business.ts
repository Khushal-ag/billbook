import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { normalizeBusinessProfile, normalizeDashboard } from "@/lib/mappers/business";
import type { BusinessProfile, UpdateBusinessProfile, BusinessUser } from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.business.dashboard(),
    queryFn: async () => {
      const res = await api.get<DashboardData>("/business/dashboard");
      return normalizeDashboard(res.data as unknown as Record<string, unknown>);
    },
  });
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: queryKeys.business.profile(),
    queryFn: async () => {
      const res = await api.get<BusinessProfile>("/business/profile");
      return normalizeBusinessProfile(res.data as unknown as Record<string, unknown>);
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBusinessProfile) => {
      const res = await api.put<BusinessProfile>("/business/profile", data);
      return normalizeBusinessProfile(res.data as unknown as Record<string, unknown>);
    },
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.business.profile()]),
  });
}

export function useBusinessUsers() {
  return useQuery({
    queryKey: queryKeys.business.users(),
    queryFn: async () => {
      const res = await api.get<BusinessUser[] | { users?: BusinessUser[] }>("/business/users");
      const data = res.data;
      if (Array.isArray(data)) return data;
      return (data as { users?: BusinessUser[] }).users ?? [];
    },
    retry: false,
  });
}
