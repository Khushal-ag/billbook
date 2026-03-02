/** Audit log action filter options. */
export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "FINALIZE", "CANCEL"] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
