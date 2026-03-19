import {
  ACTION_BADGE_VARIANTS,
  ACTION_VERBS,
  AUDIT_ACTION_UPDATE,
  AUDIT_RESOURCE_INVOICE,
  HIDDEN_HIGHLIGHT_KEYS,
  IRRELEVANT_UPDATE_KEYS,
  RESOURCE_TYPE_LABELS,
  type AuditBadgeVariant,
} from "@/constants/audit";
import { formatISODateDisplay } from "./date";

export function getActionBadgeVariant(action: string): AuditBadgeVariant {
  return ACTION_BADGE_VARIANTS[action] ?? "outline";
}

export type LogLike = {
  action: string;
  resourceType: string;
  changes: Record<string, unknown> | null;
  actorName?: string | null;
  resourceName?: string | null;
};

/** Optional context when logs are ordered newest-first (diff invoice updates vs previous entry). */
export type AuditDisplayContext = {
  previousChanges?: Record<string, unknown> | null;
};

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Human-readable label for API keys (camelCase, snake_case). */
export function formatAuditFieldLabel(key: string): string {
  const idSuffix = (word: string) => (word.toLowerCase() === "id" ? "ID" : word);

  if (key.includes("_")) {
    return key
      .split("_")
      .map((w) => idSuffix(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(" ");
  }

  const words = key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(/\s+/);
  return words.map((w) => idSuffix(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(" ");
}

function toSentenceCase(raw: string): string {
  return raw
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function extractChanges(
  changes: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!changes) return null;

  const actualChanges =
    "changes" in changes && typeof (changes as Record<string, unknown>).changes === "object"
      ? ((changes as Record<string, unknown>).changes as Record<string, unknown>)
      : changes;

  return actualChanges;
}

/** Find the next-older audit entry for the same resource (logs are newest-first). */
export function getPreviousAuditChanges(
  logs: Array<{
    id: number;
    resourceType: string;
    resourceId: number | null;
    changes: Record<string, unknown> | null;
  }>,
  current: { id: number; resourceType: string; resourceId: number | null },
): Record<string, unknown> | null {
  const idx = logs.findIndex((l) => l.id === current.id);
  if (idx === -1) return null;
  for (let i = idx + 1; i < logs.length; i++) {
    const o = logs[i];
    if (o.resourceType === current.resourceType && o.resourceId === current.resourceId) {
      return extractChanges(o.changes);
    }
  }
  return null;
}

/** Shape needed to resolve previous-invoice snapshot for audit rows. */
export type AuditLogRow = {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number | null;
  changes: Record<string, unknown> | null;
};

/** Shared by invoice Activity card and global audit table — avoids duplicating INVOICE UPDATE context logic. */
export function resolveInvoiceAuditDisplayContext(
  logs: AuditLogRow[],
  log: Pick<AuditLogRow, "id" | "action" | "resourceType" | "resourceId">,
): AuditDisplayContext | undefined {
  if (log.action !== AUDIT_ACTION_UPDATE || log.resourceType !== AUDIT_RESOURCE_INVOICE) {
    return undefined;
  }
  const prev = getPreviousAuditChanges(logs, log);
  return prev != null ? { previousChanges: prev } : undefined;
}

export type AuditHighlightParams = AuditDisplayContext & {
  resourceType: string;
  action: string;
};

export function buildAuditHighlightParams(
  log: Pick<LogLike, "resourceType" | "action">,
  invoiceCtx: AuditDisplayContext | undefined,
): AuditHighlightParams {
  return {
    ...invoiceCtx,
    resourceType: log.resourceType,
    action: log.action,
  };
}

function actionToVerb(action: string): string {
  return ACTION_VERBS[action] ?? action.toLowerCase();
}

function getStringValue(changes: Record<string, unknown> | null, key: string): string | undefined {
  const value = changes?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getActorName(log: LogLike): string {
  return log.actorName?.trim() || "Someone";
}

function getResourceLabel(resourceType: string): string {
  return (RESOURCE_TYPE_LABELS[resourceType] ?? toSentenceCase(resourceType)).toLowerCase();
}

export function getAuditResourceTypeLabel(resourceType: string): string {
  return RESOURCE_TYPE_LABELS[resourceType] ?? toSentenceCase(resourceType);
}

type LineRow = Record<string, unknown>;

function formatInvoiceTypeValue(v: unknown): string {
  if (typeof v !== "string") return String(v);
  return v
    .split("_")
    .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
    .join(" ");
}

function summarizeInvoiceLineItems(items: LineRow[]): string {
  if (!items.length) return "";
  const parts = items.map((row, i) => {
    const q = row.quantity ?? "?";
    const p = row.unitPrice != null ? ` × ${row.unitPrice}` : "";
    return items.length > 1 ? `#${i + 1}: Qty ${q}${p}` : `Qty ${q}${p}`;
  });
  return parts.join(" • ");
}

function diffInvoiceLineItems(prev: LineRow[], curr: LineRow[]): string[] {
  const messages: string[] = [];
  const prevByStock = new Map<number, LineRow>();
  for (const row of prev) {
    const id = Number(row.stockEntryId);
    if (!Number.isNaN(id)) prevByStock.set(id, row);
  }

  for (const row of curr) {
    const id = Number(row.stockEntryId);
    const p = Number.isNaN(id) ? undefined : prevByStock.get(id);
    if (p === undefined) {
      messages.push("Added a product or service");
      continue;
    }
    if (String(p.quantity ?? "") !== String(row.quantity ?? "")) {
      messages.push(`Quantity: ${p.quantity} → ${row.quantity}`);
    }
    if (String(p.unitPrice ?? "") !== String(row.unitPrice ?? "")) {
      messages.push(`Unit price: ${p.unitPrice} → ${row.unitPrice}`);
    }
    if (String(p.discountPercent ?? "") !== String(row.discountPercent ?? "")) {
      messages.push(`Discount: ${p.discountPercent}% → ${row.discountPercent}%`);
    }
  }

  const currIds = new Set(curr.map((r) => Number(r.stockEntryId)).filter((n) => !Number.isNaN(n)));
  for (const row of prev) {
    const id = Number(row.stockEntryId);
    if (!Number.isNaN(id) && !currIds.has(id)) {
      messages.push("Removed a product or service");
    }
  }

  return messages;
}

const INVOICE_PARTY_KEYS = new Set(["partyId", "partyName"]);

function getInvoiceUpdateDiff(
  curr: Record<string, unknown>,
  prev: Record<string, unknown> | null,
): { scalarLabels: string[]; changedScalarKeys: string[]; lineHighlights: string[] } {
  const scalarLabels: string[] = [];
  const changedScalarKeys: string[] = [];

  if (prev) {
    for (const key of Object.keys(curr)) {
      if (key === "items") continue;
      if (!Object.prototype.hasOwnProperty.call(prev, key)) continue;
      if (IRRELEVANT_UPDATE_KEYS.has(key)) continue;
      if (deepEqual(prev[key], curr[key])) continue;
      changedScalarKeys.push(key);
      scalarLabels.push(formatAuditFieldLabel(key));
    }
  }

  const onlyPartyHeaderChange =
    changedScalarKeys.length > 0 && changedScalarKeys.every((k) => INVOICE_PARTY_KEYS.has(k));

  let lineHighlights: string[] = [];
  if (Array.isArray(curr.items) && curr.items.length > 0) {
    const currItems = curr.items as LineRow[];
    if (prev && Array.isArray(prev.items) && (prev.items as LineRow[]).length > 0) {
      lineHighlights = diffInvoiceLineItems(prev.items as LineRow[], currItems);
    } else if (prev && Array.isArray(prev.items) && (prev.items as LineRow[]).length === 0) {
      lineHighlights = diffInvoiceLineItems([], currItems);
    } else if (!prev || !Array.isArray(prev.items)) {
      const summary = summarizeInvoiceLineItems(currItems);
      if (summary && (changedScalarKeys.length === 0 || !onlyPartyHeaderChange)) {
        lineHighlights = [summary];
      }
    }
  }

  return { scalarLabels, lineHighlights, changedScalarKeys };
}

function buildInvoiceUpdateTitle(
  curr: Record<string, unknown>,
  prev: Record<string, unknown> | null,
): string {
  const { scalarLabels, lineHighlights } = getInvoiceUpdateDiff(curr, prev);
  const hasLineDetail = lineHighlights.length > 0;
  const hasLineDiff = lineHighlights.some(
    (m) => m.includes("→") || m.startsWith("Added") || m.startsWith("Removed"),
  );

  if (hasLineDiff || (hasLineDetail && scalarLabels.length > 0)) {
    if (scalarLabels.length > 0) {
      return `updated ${scalarLabels[0].toLowerCase()} and items`;
    }
    return "updated items";
  }

  if (scalarLabels.length > 0) {
    const parts = scalarLabels.slice(0, 2).map((l) => l.toLowerCase());
    return parts.length === 2 ? `updated ${parts[0]} and ${parts[1]}` : `updated ${parts[0]}`;
  }

  if (hasLineDetail) {
    return "updated items";
  }

  return "details updated";
}

function buildUpdateSummary(
  resourceType: string,
  changes: Record<string, unknown> | null,
  ctx?: AuditDisplayContext,
): string {
  const actualChanges = extractChanges(changes);
  if (!actualChanges) return "details updated";

  if (resourceType === "ITEM" && "isActive" in actualChanges) {
    return actualChanges.isActive ? "item was activated" : "item was deactivated";
  }

  if (resourceType === AUDIT_RESOURCE_INVOICE && ctx?.previousChanges != null && actualChanges) {
    return buildInvoiceUpdateTitle(actualChanges, ctx.previousChanges);
  }

  const relevantKeys = Object.keys(actualChanges).filter((key) => !IRRELEVANT_UPDATE_KEYS.has(key));

  if (relevantKeys.length === 0) return "details updated";

  const priority = (k: string) => {
    const order = [
      "items",
      "totalAmount",
      "discountAmount",
      "discountPercent",
      "roundOffAmount",
      "dueDate",
      "invoiceDate",
      "invoiceNumber",
      "partyName",
      "partyId",
      "invoiceType",
    ];
    const i = order.indexOf(k);
    return i === -1 ? 50 : i;
  };
  relevantKeys.sort((a, b) => priority(a) - priority(b));

  return `updated ${relevantKeys
    .slice(0, 2)
    .map((key) => formatAuditFieldLabel(key).toLowerCase())
    .join(" and ")}`;
}

function formatQuantityHighlight(actualChanges: Record<string, unknown>): string {
  const quantity = String(actualChanges.quantity);
  const purchaseDate = getStringValue(actualChanges, "purchaseDate");
  const beforeQty = actualChanges.beforeQuantity;
  const afterQty = actualChanges.afterQuantity;

  if (beforeQty !== undefined && afterQty !== undefined) {
    return `Quantity changed from ${beforeQty} to ${afterQty}`;
  }

  const formattedPurchaseDate = purchaseDate ? formatISODateDisplay(purchaseDate) : "";
  return formattedPurchaseDate
    ? `Quantity: ${quantity} • Purchase date: ${formattedPurchaseDate}`
    : `Quantity: ${quantity}`;
}

function formatEntryValue(key: string, value: unknown): string {
  if (key === "invoiceType" && typeof value === "string") {
    return formatInvoiceTypeValue(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.length > 40 ? `${value.slice(0, 40)}...` : value;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (key === "items") return summarizeInvoiceLineItems(value as LineRow[]) || "—";
    return `${value.length} item(s)`;
  }
  return String(value);
}

export function getAuditActivityTitle(log: LogLike, ctx?: AuditDisplayContext): string {
  const actor = getActorName(log);
  const resourceLabel = getResourceLabel(log.resourceType);
  const resource = log.resourceName?.trim();
  const actualChanges = extractChanges(log.changes);

  if (log.action === "ACTIVATE" || log.action === "DEACTIVATE") {
    const verb = actionToVerb(log.action);
    const entityName = resource || getStringValue(actualChanges, "name");
    return entityName
      ? `${actor} ${verb} ${resourceLabel} ${entityName}`
      : `${actor} ${verb} ${resourceLabel}`;
  }

  if (
    log.resourceType === "ITEM" &&
    log.action === "UPDATE" &&
    actualChanges?.isActive !== undefined
  ) {
    const isActive = Boolean(actualChanges.isActive);
    const itemName = resource || getStringValue(actualChanges, "name") || "item";
    return `${actor} ${isActive ? "activated" : "deactivated"} item ${itemName}`;
  }

  if (log.resourceType === "STOCK_ENTRY" && log.action === "CREATE") {
    const itemName = getStringValue(actualChanges, "itemName") || resource || "an item";
    return `${actor} added stock for ${itemName}`;
  }

  if (log.resourceType === "STOCK_ADJUSTMENT" && log.action === "CREATE") {
    const itemName = getStringValue(actualChanges, "itemName") || "an item";
    return `${actor} adjusted stock for ${itemName}`;
  }

  if (log.resourceType === "PARTY" && log.action === "CREATE") {
    const partyName = getStringValue(actualChanges, "name") || resource || "a party";
    const partyType = getStringValue(actualChanges, "type");
    if (partyType) {
      return `${actor} added ${partyType.toLowerCase()} ${partyName}`;
    }
    return `${actor} added party ${partyName}`;
  }

  if (log.resourceType === "ITEM" && log.action === "CREATE") {
    const itemName = getStringValue(actualChanges, "name") || resource || "an item";
    return `${actor} added item ${itemName}`;
  }

  if (log.action === "UPDATE") {
    const updateSummary = buildUpdateSummary(log.resourceType, log.changes, ctx);
    return resource ? `${actor} ${updateSummary} for ${resource}` : `${actor} ${updateSummary}`;
  }

  return resource
    ? `${actor} ${actionToVerb(log.action)} ${resourceLabel} ${resource}`
    : `${actor} ${actionToVerb(log.action)} ${resourceLabel}`;
}

export function getAuditMeta(log: LogLike): string {
  return `${getAuditResourceTypeLabel(log.resourceType)} • ${toSentenceCase(log.action)}`;
}

export function getAuditChangeHighlights(
  changes: Record<string, unknown> | null,
  ctx?: AuditDisplayContext & { resourceType?: string; action?: string },
): string {
  const actualChanges = extractChanges(changes);
  if (!actualChanges) return "";

  if (typeof actualChanges.quantity === "string" || typeof actualChanges.quantity === "number") {
    return formatQuantityHighlight(actualChanges);
  }

  if (typeof actualChanges.type === "string") {
    return `Type: ${toSentenceCase(actualChanges.type)}`;
  }

  if (typeof actualChanges.reason === "string" && actualChanges.reason.trim()) {
    return `Reason: ${actualChanges.reason}`;
  }

  if (
    ctx?.resourceType === AUDIT_RESOURCE_INVOICE &&
    ctx?.action === AUDIT_ACTION_UPDATE &&
    ctx.previousChanges != null
  ) {
    const { scalarLabels, lineHighlights } = getInvoiceUpdateDiff(
      actualChanges,
      ctx.previousChanges,
    );
    const parts: string[] = [];

    if (lineHighlights.length > 0) {
      parts.push(lineHighlights.join(" • "));
    }

    const scalarEntries = Object.entries(actualChanges).filter(([key]) => {
      if (key === "items") return false;
      if (HIDDEN_HIGHLIGHT_KEYS.has(key)) return false;
      if (!Object.prototype.hasOwnProperty.call(ctx.previousChanges ?? {}, key)) return false;
      return !deepEqual((ctx.previousChanges as Record<string, unknown>)[key], actualChanges[key]);
    });

    for (const [key, value] of scalarEntries.slice(0, 4)) {
      if (scalarLabels.includes(formatAuditFieldLabel(key))) {
        parts.push(`${formatAuditFieldLabel(key)}: ${formatEntryValue(key, value)}`);
      }
    }

    if (parts.length > 0) return parts.join(" • ");
  }

  const entries = Object.entries(actualChanges);

  const readableEntries = entries
    .filter(([key]) => !HIDDEN_HIGHLIGHT_KEYS.has(key))
    .slice(0, 4)
    .map(([key, value]) => `${formatAuditFieldLabel(key)}: ${formatEntryValue(key, value)}`);

  if (readableEntries.length === 0) return "";

  return readableEntries.join(" • ");
}
