import type { Role } from "./auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "FINALIZE" | "CANCEL";

export interface AuditLog {
  id: number;
  businessId: number;
  actorUserId: number | null;
  actorRole: Role | null;
  action: string;
  resourceType: string;
  resourceId: number | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

/** GET /audit response */
export interface AuditLogListResponse {
  logs: AuditLog[];
  page: number;
  pageSize: number;
  count: number;
}
