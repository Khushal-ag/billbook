import type { Role } from "./auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "FINALIZE" | "CANCEL";

export type AuditResourceType =
  | "INVOICE"
  | "PAYMENT"
  | "PRODUCT"
  | "PARTY"
  | "CREDIT_NOTE"
  | "STOCK_ADJUSTMENT";

export interface AuditLog {
  id: number;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: number;
  userId: number;
  userName: string;
  userRole: Role;
  details?: string;
  createdAt: string;
}
