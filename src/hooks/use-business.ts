import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { BusinessProfile, UpdateBusinessProfile, BusinessUser } from "@/types/auth";
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
      const res = await api.get<BusinessProfile>("/business/profile");
      return res.data;
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBusinessProfile) => {
      const res = await api.put<BusinessProfile>("/business/profile", data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-profile"] }),
  });
}

export function useBusinessUsers() {
  return useQuery({
    queryKey: ["business-users"],
    queryFn: async () => {
      const res = await api.get<BusinessUser[]>("/business/users");
      return res.data;
    },
  });
}
