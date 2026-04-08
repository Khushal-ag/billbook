/**
 * Pure functions that normalize invoice-related API responses.
 * Lives under `lib/` (not `hooks/`) because these are not React hooks.
 */
import type {
  InvoiceCommunicationChannel,
  InvoiceCommunicationsSummary,
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

/** Normalize communications API (isToday → today, build latest). */
export function normalizeCommunicationsSummary(
  raw: Record<string, unknown> & {
    sent?: { action?: string; channel?: string; actionDate?: string; isToday?: boolean } | null;
    reminder?: { action?: string; channel?: string; actionDate?: string; isToday?: boolean } | null;
  },
  invoiceId: number,
): InvoiceCommunicationsSummary {
  const toLatest = (s: typeof raw.sent): InvoiceCommunicationsSummary["sent"]["latest"] =>
    s
      ? {
          id: 0,
          business_id: 0,
          invoice_id: invoiceId,
          channel: (s.channel ?? null) as InvoiceCommunicationChannel | null,
          action: (s.action as "SENT" | "REMINDER") ?? "SENT",
          metadata: null,
          action_date: s.actionDate ?? "",
          created_at: "",
        }
      : null;
  return {
    invoiceId,
    sent: {
      today: raw.sent?.isToday ?? false,
      latest: toLatest(raw.sent),
    },
    reminder: {
      today: raw.reminder?.isToday ?? false,
      latest: toLatest(raw.reminder),
    },
  };
}
