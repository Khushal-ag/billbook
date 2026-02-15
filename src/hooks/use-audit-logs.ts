import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buildQueryString } from "@/lib/utils";
import type { AuditLog } from "@/types/audit-log";
import type { PaginatedResponse } from "@/types/api";

export function useAuditLogs(
  params: { page?: number; pageSize?: number; action?: string } = {},
) {
  const { page = 1, pageSize = 20, action } = params;
  const qs = buildQueryString({ page, pageSize, action });

  return useQuery({
    queryKey: ["audit-logs", page, pageSize, action],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<AuditLog>>(`/audit?${qs}`);
      return res.data;
    },
  });
}
