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

/** Combine server message with structured return-qty details for toasts (keeps request id). */
export function withInvoiceQuantityErrorDetails(err: unknown): unknown {
  if (!(err instanceof ApiClientError)) return err;
  const extra = formatInvoiceQuantityErrorDetails(err.details);
  if (!extra) return err;
  return new ApiClientError(`${err.message}\n${extra}`, err.status, err.details, err.requestId);
}
