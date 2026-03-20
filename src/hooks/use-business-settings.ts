import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query";
import type {
  BusinessSettingsData,
  UpdateBusinessSettingsRequest,
} from "@/types/business-settings";

export function useBusinessSettings() {
  return useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const res = await api.get<BusinessSettingsData>("/business/settings");
      return res.data;
    },
  });
}

export function useUpdateBusinessSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateBusinessSettingsRequest) => {
      const res = await api.put<BusinessSettingsData>("/business/settings", body);
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [
        ["business-settings"],
        ["business-profile"],
        ["invoice-next-number"],
      ]);
    },
  });
}
