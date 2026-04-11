import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { ApiClientError } from "@/api/error";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { normalizeBusinessProfile, normalizeDashboard } from "@/lib/mappers/business";
import type {
  BusinessProfile,
  UpdateBusinessProfile,
  BusinessUser,
  BusinessClassificationOption,
} from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";

type BusinessTypeApiItem = {
  id?: unknown;
  name?: unknown;
  isPredefined?: unknown;
};

function normalizeBusinessClassificationOption(
  item: BusinessTypeApiItem,
): BusinessClassificationOption | null {
  const id = Number(item.id);
  const name = typeof item.name === "string" ? item.name.trim() : "";

  if (!Number.isFinite(id) || name === "") return null;

  return {
    id,
    name,
    isPredefined: Boolean(item.isPredefined),
  };
}

function toBusinessClassificationOptions(input: unknown): BusinessClassificationOption[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => normalizeBusinessClassificationOption((item ?? {}) as Record<string, unknown>))
    .filter((item): item is BusinessClassificationOption => item !== null);
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.business.dashboard(),
    queryFn: async () => {
      const res = await api.get<DashboardData>("/business/dashboard");
      return normalizeDashboard(res.data as unknown as Record<string, unknown>);
    },
    retry: (failureCount, err) => {
      if (err instanceof ApiClientError && err.status === 401) return false;
      return failureCount < 2;
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

export function useBusinessTypeOptions() {
  return useQuery({
    queryKey: queryKeys.business.businessTypes(),
    queryFn: async () => {
      const res = await api.get<{ businessTypes?: BusinessTypeApiItem[] }>(
        "/business/business-types",
      );
      return toBusinessClassificationOptions(res.data.businessTypes);
    },
  });
}

export function useIndustryTypeOptions() {
  return useQuery({
    queryKey: queryKeys.business.industryTypes(),
    queryFn: async () => {
      const res = await api.get<{ industryTypes?: BusinessTypeApiItem[] }>(
        "/business/industry-types",
      );
      return toBusinessClassificationOptions(res.data.industryTypes);
    },
  });
}

export function useCreateBusinessTypeOption() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const trimmedName = name.trim();
      await api.post("/business/business-types", { name: trimmedName });
      return trimmedName;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.business.businessTypes()]);
    },
  });
}

export function useCreateIndustryTypeOption() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const trimmedName = name.trim();
      await api.post("/business/industry-types", { name: trimmedName });
      return trimmedName;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.business.industryTypes()]);
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
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.business.profile(), profile);
      invalidateQueryKeys(qc, [queryKeys.business.profile()]);
    },
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
