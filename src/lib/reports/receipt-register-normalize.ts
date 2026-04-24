import type { ReceiptRegisterData, ReceiptRegisterRowDto, ReportPeriod } from "@/types/report";

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return undefined;
}

function normalizePeriod(root: Record<string, unknown>): ReportPeriod {
  const p = root.period;
  const src = p && typeof p === "object" ? (p as Record<string, unknown>) : root;
  return {
    startDate: pickString(src, "startDate", "start_date") ?? "",
    endDate: pickString(src, "endDate", "end_date") ?? "",
  };
}

function normalizeRow(raw: unknown): ReceiptRegisterRowDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id)) return null;

  const opening =
    pickString(o, "openingBalanceSettlementAmount", "opening_balance_settlement_amount") ?? null;

  return {
    id,
    receiptNumber: pickString(o, "receiptNumber", "receipt_number") ?? "",
    partyId: (() => {
      const n = Number(o.partyId ?? o.party_id);
      return Number.isFinite(n) ? n : undefined;
    })(),
    partyName: pickString(o, "partyName", "party_name", "customerName", "customer_name"),
    totalAmount: pickString(o, "totalAmount", "total_amount") ?? "0",
    allocatedAmount: pickString(o, "allocatedAmount", "allocated_amount"),
    unallocatedAmount: pickString(o, "unallocatedAmount", "unallocated_amount") ?? "0",
    openingBalanceSettlementAmount: opening,
    paymentMethod: pickString(o, "paymentMethod", "payment_method") ?? "",
    referenceNumber:
      pickString(
        o,
        "referenceNumber",
        "reference_number",
        "referenceInvoiceNumber",
        "reference_invoice_number",
      ) ?? null,
    linkedInvoiceSummary:
      pickString(
        o,
        "linkedInvoiceSummary",
        "linked_invoice_summary",
        "invoiceNumbers",
        "invoice_numbers",
        "primaryInvoiceNumber",
        "primary_invoice_number",
        "allocatedInvoiceNumbers",
        "allocated_invoice_numbers",
        "invoiceNumberList",
        "invoice_number_list",
      ) ?? null,
    notes: pickString(o, "notes", "note") ?? null,
    receivedAt: pickString(o, "receivedAt", "received_at", "receiptDate", "receipt_date") ?? "",
    createdAt: pickString(o, "createdAt", "created_at") ?? "",
  };
}

/**
 * Maps GET /reports/receipt-register payloads to camelCase row DTOs. Supports snake_case and a few
 * alternate keys so the UI stays correct if the report API shape lags the rest of the stack.
 */
export function normalizeReceiptRegisterData(raw: unknown): ReceiptRegisterData {
  if (!raw || typeof raw !== "object") {
    return {
      period: { startDate: "", endDate: "" },
      limit: 0,
      receipts: [],
    };
  }
  const root = raw as Record<string, unknown>;
  const receiptsRaw = root.receipts ?? root.receipt_list;
  const receipts: ReceiptRegisterRowDto[] = Array.isArray(receiptsRaw)
    ? receiptsRaw.map(normalizeRow).filter((r): r is ReceiptRegisterRowDto => r != null)
    : [];

  const limit = Number(root.limit);
  return {
    period: normalizePeriod(root),
    limit: Number.isFinite(limit) ? limit : 0,
    receipts,
  };
}
