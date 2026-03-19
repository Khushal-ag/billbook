/** Preset cancellation reasons (each must satisfy API 3–2000 chars trimmed). */
export const INVOICE_CANCEL_PRESET_REASONS = [
  { id: "duplicate", label: "Duplicate invoice", reason: "Duplicate invoice" },
  { id: "mistake", label: "Created by mistake", reason: "Created by mistake" },
  {
    id: "customer",
    label: "Customer requested cancellation",
    reason: "Customer requested cancellation",
  },
  { id: "pricing", label: "Pricing or terms changed", reason: "Pricing or terms changed" },
  { id: "wrong_details", label: "Wrong party or details", reason: "Wrong party or details" },
] as const;

export const INVOICE_CANCEL_OTHER_ID = "other" as const;

export const CANCEL_INVOICE_REASON_MIN = 3;
export const CANCEL_INVOICE_REASON_MAX = 2000;

export function validateCancelInvoiceReason(reason: string): string | null {
  const t = reason.trim();
  if (t.length < CANCEL_INVOICE_REASON_MIN) {
    return `Reason must be at least ${CANCEL_INVOICE_REASON_MIN} characters.`;
  }
  if (t.length > CANCEL_INVOICE_REASON_MAX) {
    return `Reason must be at most ${CANCEL_INVOICE_REASON_MAX} characters.`;
  }
  return null;
}
