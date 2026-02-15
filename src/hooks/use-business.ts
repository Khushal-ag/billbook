import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { Business } from "@/types/auth";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardData>("/business/dashboard");
      return res.data;
    },
  });
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
      const res = await api.get<Business>("/business/profile");
      return res.data;
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Business>) => {
      const res = await api.put<Business>("/business/profile", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-profile"] }),
  });
}
