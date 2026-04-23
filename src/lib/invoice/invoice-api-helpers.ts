/**
 * Pure functions that normalize invoice-related API responses.
 * Lives under `lib/` (not `hooks/`) because these are not React hooks.
 */
import type {
  InvoiceCommunicationsSummary,
  InvoiceMarkCommunicationResponse,
  LegacyInvoicePayment,
  RecordSupplierPaymentData,
} from "@/types/invoice";
import { parseInvoicePaymentResponse, type RecordInvoicePaymentData } from "@/types/receipt";

export type RecordPaymentResult =
  | { mode: "receipt"; data: RecordInvoicePaymentData }
  | { mode: "legacy"; payment: LegacyInvoicePayment };

export function parseRecordPaymentResponse(data: unknown): RecordPaymentResult {
  const parsed = parseInvoicePaymentResponse(data);
  if (parsed) return { mode: "receipt", data: parsed };
  const o = data as Record<string, unknown> | null;
  if (o && typeof o.id === "number" && typeof o.amount === "string") {
    return { mode: "legacy", payment: o as unknown as LegacyInvoicePayment };
  }
  throw new Error("Unexpected payment response from server");
}

function isRecordSupplierPaymentData(v: unknown): v is RecordSupplierPaymentData {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const p = o.payment;
  if (!p || typeof p !== "object") return false;
  const pay = p as Record<string, unknown>;
  return typeof pay.id === "number" && typeof o.allocatedToThisInvoice === "string";
}

export function parseRecordSupplierPaymentResponse(data: unknown): RecordSupplierPaymentData {
  if (!isRecordSupplierPaymentData(data)) {
    throw new Error("Unexpected supplier payment response from server");
  }
  return data;
}

function communicationsTodayFlag(bucket: unknown): boolean {
  if (!bucket || typeof bucket !== "object") return false;
  const b = bucket as Record<string, unknown>;
  if (typeof b.isToday === "boolean") return b.isToday;
  if (typeof b.today === "boolean") return b.today;
  return false;
}

/** Normalize communications API (`isToday` / `today` → `sent.today` / `reminder.today`). */
export function normalizeCommunicationsSummary(
  raw: Record<string, unknown>,
  invoiceId: number,
): InvoiceCommunicationsSummary {
  return {
    invoiceId,
    sent: { today: communicationsTodayFlag(raw.sent) },
    reminder: { today: communicationsTodayFlag(raw.reminder) },
  };
}

const DELIVERY_OUTCOMES = new Set([
  "sent",
  "already_recorded_today",
  "skipped_integration_pending",
]);

export function parseInvoiceMarkCommunicationResponse(
  data: unknown,
): InvoiceMarkCommunicationResponse {
  if (!data || typeof data !== "object") throw new Error("Invalid mark communication response");
  const root = data as Record<string, unknown>;
  const communication = root.communication;
  const delivery = root.delivery;
  if (!communication || typeof communication !== "object") {
    throw new Error("Invalid mark communication response");
  }
  if (!delivery || typeof delivery !== "object") {
    throw new Error("Invalid mark communication response");
  }
  const d = delivery as Record<string, unknown>;
  const outcome = d.outcome;
  if (typeof outcome !== "string" || !DELIVERY_OUTCOMES.has(outcome)) {
    throw new Error("Invalid mark communication response");
  }
  return data as InvoiceMarkCommunicationResponse;
}

/** User-facing success copy after mark-reminder (email). */
export function markReminderFeedbackMessage(res: InvoiceMarkCommunicationResponse): string {
  const msg = typeof res.delivery.message === "string" ? res.delivery.message.trim() : "";
  if (msg) return msg;
  switch (res.delivery.outcome) {
    case "sent":
      return "Reminder sent";
    case "already_recorded_today":
      return "Already sent today";
    default:
      return "Reminder updated";
  }
}

/** User-facing success copy after mark-sent (WhatsApp stub). */
export function markSentFeedbackMessage(res: InvoiceMarkCommunicationResponse): string {
  const msg = typeof res.delivery.message === "string" ? res.delivery.message.trim() : "";
  if (msg) return msg;
  const preview =
    typeof res.delivery.messagePreview === "string" ? res.delivery.messagePreview.trim() : "";
  if (res.delivery.outcome === "skipped_integration_pending") {
    return preview ? `WhatsApp not live yet — ${preview}` : "WhatsApp not live yet — logged.";
  }
  if (res.delivery.outcome === "already_recorded_today") {
    return "Already logged today";
  }
  return "Logged for WhatsApp";
}
