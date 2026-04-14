import { ApiClientError } from "@/api/error";

/** API may send `{ code, details: { maxReturnable, ... } }` or a flat object. */
function extractQuantityPayload(details: unknown): Record<string, unknown> | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const d = details as Record<string, unknown>;
  const nested = d.details;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    if (
      "maxReturnable" in n ||
      "originalQuantity" in n ||
      "alreadyReturned" in n ||
      "sourceInvoiceItemId" in n
    ) {
      return n;
    }
  }
  if (
    "maxReturnable" in d ||
    "originalQuantity" in d ||
    "alreadyReturned" in d ||
    "sourceInvoiceItemId" in d
  ) {
    return d;
  }
  return null;
}

/**
 * Formats API `details` from sale/purchase return quantity validation (e.g. maxReturnable).
 */
export function formatInvoiceQuantityErrorDetails(details: unknown): string {
  const d = extractQuantityPayload(details);
  if (!d) return "";
  const parts: string[] = [];
  const orig = d.originalQuantity;
  const already = d.alreadyReturned;
  const max = d.maxReturnable;
  const thisRet = d.thisReturn;
  const lineRef = d.sourceInvoiceItemId;
  if (orig != null) parts.push(`Original qty: ${String(orig)}`);
  if (already != null) parts.push(`Already returned: ${String(already)}`);
  if (thisRet != null) parts.push(`This document: ${String(thisRet)}`);
  if (max != null) parts.push(`Max returnable now: ${String(max)}`);
  if (lineRef != null) parts.push("Linked to an original line on the source invoice");
  return parts.length ? parts.join(" · ") : "";
}

/**
 * Structured 400s when linked return / inventory lines do not match the source invoice
 * (item id, stock batch) — sale returns, purchase returns, or similar validations.
 */
export function formatReturnInventoryMismatchDetails(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const d = details as Record<string, unknown>;
  const nested =
    d.details && typeof d.details === "object" && !Array.isArray(d.details)
      ? (d.details as Record<string, unknown>)
      : d;
  const parts: string[] = [];

  const pick = (k: string) => nested[k] ?? d[k];

  const expItem = pick("expectedItemId") ?? pick("expected_item_id") ?? pick("sourceItemId");
  const gotItem = pick("itemId") ?? pick("actualItemId");
  if (expItem != null && gotItem != null && String(expItem) !== String(gotItem)) {
    parts.push(
      `Item id must match the source invoice line (expected ${String(expItem)}, got ${String(gotItem)}).`,
    );
  }

  const expEntry =
    pick("expectedStockEntryId") ?? pick("expected_stock_entry_id") ?? pick("sourceStockEntryId");
  const gotEntry = pick("stockEntryId") ?? pick("actualStockEntryId");
  if (expEntry != null && gotEntry != null && String(expEntry) !== String(gotEntry)) {
    parts.push(
      `Stock batch must match the source line (expected ${String(expEntry)}, got ${String(gotEntry)}).`,
    );
  }

  const field = pick("field");
  const msg = pick("message");
  if (typeof field === "string" && typeof msg === "string" && msg.trim()) {
    parts.push(`${field}: ${msg.trim()}`);
  }

  const errs = pick("errors");
  if (Array.isArray(errs)) {
    for (const e of errs) {
      if (e && typeof e === "object" && !Array.isArray(e)) {
        const fe = e as Record<string, unknown>;
        const f = fe.field;
        const m = fe.message ?? fe.error;
        if (typeof m === "string" && m.trim()) {
          parts.push(typeof f === "string" && f.trim() ? `${f.trim()}: ${m.trim()}` : m.trim());
        }
      }
    }
  }

  return parts.length ? parts.join("\n") : "";
}

/** Combine server message with structured invoice validation details for toasts. */
export function withInvoiceQuantityErrorDetails(err: unknown): unknown {
  if (!(err instanceof ApiClientError)) return err;
  const qty = formatInvoiceQuantityErrorDetails(err.details);
  const pr = formatReturnInventoryMismatchDetails(err.details);
  const extra = [qty, pr].filter(Boolean).join("\n");
  if (!extra) return err;
  return new ApiClientError(`${err.message}\n${extra}`, err.status, err.details, err.requestId);
}
