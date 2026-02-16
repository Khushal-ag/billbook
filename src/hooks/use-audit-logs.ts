import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { buildQueryString } from "@/lib/utils";
import type { AuditLogListResponse } from "@/types/audit-log";

export function useAuditLogs(params: { page?: number; pageSize?: number; action?: string } = {}) {
  const { page = 1, pageSize = 20, action } = params;

  const qs = action ? `action=${encodeURIComponent(action)}` : buildQueryString({ page, pageSize });

  const endpoint = action ? `/audit/by-action?${qs}` : `/audit?${qs}`;

  return useQuery({
    queryKey: ["audit-logs", page, pageSize, action],
    queryFn: async () => {
      const res = await api.get<AuditLogListResponse>(endpoint);
      return res.data;
    },
  });
}
