import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { Alert, AlertListResponse } from "@/types/alert";

export function useAlerts(unreadOnly = false) {
  const qs = unreadOnly ? "?unreadOnly=true" : "";
  return useQuery({
    queryKey: ["alerts", unreadOnly],
    queryFn: async () => {
      const res = await api.get<AlertListResponse>(`/alerts${qs}`);
      return res.data;
    },
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: number) => {
      const res = await api.patch<Alert>(`/alerts/${alertId}/read`, {});
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
