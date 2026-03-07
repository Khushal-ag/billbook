import {
  ACTION_BADGE_VARIANTS,
  ACTION_VERBS,
  HIDDEN_HIGHLIGHT_KEYS,
  IRRELEVANT_UPDATE_KEYS,
  RESOURCE_TYPE_LABELS,
  type AuditBadgeVariant,
} from "@/constants/audit";
import { formatISODateDisplay } from "./date";

export function getActionBadgeVariant(action: string): AuditBadgeVariant {
  return ACTION_BADGE_VARIANTS[action] ?? "outline";
}

type LogLike = {
  action: string;
  resourceType: string;
  changes: Record<string, unknown> | null;
  actorName?: string | null;
  resourceName?: string | null;
};

function toSentenceCase(raw: string): string {
  return raw
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractChanges(changes: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!changes) return null;

  const actualChanges =
    "changes" in changes && typeof (changes as Record<string, unknown>).changes === "object"
      ? ((changes as Record<string, unknown>).changes as Record<string, unknown>)
      : changes;

  return actualChanges;
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

function buildUpdateSummary(resourceType: string, changes: Record<string, unknown> | null): string {
  const actualChanges = extractChanges(changes);
  if (!actualChanges) return "details updated";

  if (resourceType === "ITEM" && "isActive" in actualChanges) {
    return actualChanges.isActive ? "item was activated" : "item was deactivated";
  }

  const relevantKeys = Object.keys(actualChanges).filter((key) => !IRRELEVANT_UPDATE_KEYS.has(key));

  if (relevantKeys.length === 0) return "details updated";

  return `updated ${relevantKeys
    .slice(0, 2)
    .map((key) => toSentenceCase(key))
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

function formatEntryValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.length > 40 ? `${value.slice(0, 40)}...` : value;
  return String(value);
}

export function getAuditActivityTitle(log: LogLike): string {
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
    const updateSummary = buildUpdateSummary(log.resourceType, log.changes);
    return resource ? `${actor} ${updateSummary} for ${resource}` : `${actor} ${updateSummary}`;
  }

  return resource
    ? `${actor} ${actionToVerb(log.action)} ${resourceLabel} ${resource}`
    : `${actor} ${actionToVerb(log.action)} ${resourceLabel}`;
}

export function getAuditMeta(log: LogLike): string {
  return `${getAuditResourceTypeLabel(log.resourceType)} • ${toSentenceCase(log.action)}`;
}

export function getAuditChangeHighlights(changes: Record<string, unknown> | null): string {
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

  const entries = Object.entries(actualChanges);

  const readableEntries = entries
    .filter(([key]) => !HIDDEN_HIGHLIGHT_KEYS.has(key))
    .slice(0, 2)
    .map(([key, value]) => `${toSentenceCase(key)}: ${formatEntryValue(value)}`);

  if (readableEntries.length === 0) return "";

  return readableEntries.join(" • ");
}
