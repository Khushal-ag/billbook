import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { buildQueryString } from "@/lib/utils";
import type { AuditLogListResponse } from "@/types/audit-log";

export function useAuditLogs(params: { page?: number; pageSize?: number; action?: string } = {}) {
  const { page = 1, pageSize = 20, action } = params;

  // Build query string with both pagination and action filter
  const qs = action
    ? buildQueryString({ page, pageSize, action })
    : buildQueryString({ page, pageSize });

  const endpoint = action ? `/audit/by-action?${qs}` : `/audit?${qs}`;

  return useQuery({
    queryKey: ["audit-logs", page, pageSize, action],
    queryFn: async () => {
      const res = await api.get<AuditLogListResponse>(endpoint);
      return res.data;
    },
  });
}

export function useResourceAuditLogs(resourceType: string, resourceId: number | undefined) {
  return useQuery({
    queryKey: ["audit-logs", "resource", resourceType, resourceId],
    queryFn: async () => {
      const res = await api.get<AuditLogListResponse>(`/audit/${resourceType}/${resourceId}`);
      return res.data;
    },
    enabled: !!resourceId,
  });
}
