import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { invalidateQueryKeys } from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import type { Alert, AlertListResponse } from "@/types/alert";

export function useAlerts(unreadOnly = false, enabled = true, options?: { limit?: number }) {
  const limit = options?.limit;
  const qs = new URLSearchParams();
  if (unreadOnly) qs.set("unreadOnly", "true");
  if (limit != null) qs.set("limit", String(limit));
  const q = qs.toString();
  return useQuery({
    queryKey: queryKeys.alerts.list(unreadOnly, limit),
    queryFn: async () => {
      const res = await api.get<AlertListResponse>(`/alerts${q ? `?${q}` : ""}`);
      return res.data;
    },
    enabled,
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: number) => {
      const res = await api.patch<Alert>(`/alerts/${alertId}/read`, {});
      return res.data;
    },
    onSuccess: () => invalidateQueryKeys(qc, [queryKeys.alerts.root()]),
  });
}
