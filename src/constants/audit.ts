/** Audit log action filter options. */
export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "FINALIZE",
  "CANCEL",
  "ACTIVATE",
  "DEACTIVATE",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Resource / action strings used when resolving invoice update diffs in audit UI. */
export const AUDIT_RESOURCE_INVOICE = "INVOICE" as const;
export const AUDIT_ACTION_UPDATE = "UPDATE" as const;

export type AuditBadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const ACTION_BADGE_VARIANTS: Record<string, AuditBadgeVariant> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  FINALIZE: "default",
  CANCEL: "destructive",
  ACTIVATE: "default",
  DEACTIVATE: "outline",
};

export const ACTION_VERBS: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  FINALIZE: "finalized",
  CANCEL: "canceled",
  ACTIVATE: "activated",
  DEACTIVATE: "deactivated",
};

export const ACTION_DOT_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500",
  UPDATE: "bg-amber-500",
  DELETE: "bg-rose-500",
  CANCEL: "bg-rose-500",
  FINALIZE: "bg-sky-500",
  ACTIVATE: "bg-emerald-500",
  DEACTIVATE: "bg-slate-500",
};

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  ITEM: "Item",
  LOW_STOCK_THRESHOLD: "Low Stock Threshold",
  PARTY: "Party",
  CATEGORY: "Category",
  STOCK_ENTRY: "Stock Entry",
  STOCK_ADJUSTMENT: "Stock Adjustment",
  INVOICE: "Invoice",
  PAYMENT: "Payment",
  CREDIT_NOTE: "Credit Note",
  UNIT: "Unit",
  INVOICE_COMMUNICATION: "Invoice Communication",
  RECEIPT: "Receipt",
  OUTBOUND_PAYMENT: "Outbound payment",
};

export const IRRELEVANT_UPDATE_KEYS = new Set([
  "actorUserId",
  "actorName",
  "businessId",
  "resourceId",
]);

export const HIDDEN_HIGHLIGHT_KEYS = new Set([
  "actorUserId",
  "actorName",
  "businessId",
  "resourceId",
  "itemId",
  "isActive",
]);
