import type { Role } from "./auth";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "FINALIZE"
  | "CANCEL"
  | "ACTIVATE"
  | "DEACTIVATE";

export interface AuditLog {
  id: number;
  businessId: number;
  actorUserId: number | null;
  actorRole: Role | null;
  actorName?: string | null;
  action: string;
  resourceType: string;
  resourceId: number | null;
  resourceName?: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  page: number;
  pageSize: number;
  count: number;
}
