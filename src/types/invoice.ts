export type InvoiceStatus = "DRAFT" | "FINAL" | "CANCELLED";
export type InvoiceType = "SALE_INVOICE" | "SALE_RETURN" | "PURCHASE_INVOICE" | "PURCHASE_RETURN";

export type PaymentMethod = "CASH" | "CHEQUE" | "UPI" | "BANK_TRANSFER" | "CARD";

export interface Invoice {
  id: number;
  businessId: number;
  invoiceNumber: string;
  financialYear: string | null;
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  partyId: number;
  invoiceDate: string;
  dueDate: string | null;
  subTotal: string;
  discountAmount: string | null;
  discountPercent: string | null;
  roundOffAmount?: string | null;
  cgstAmount: string | null;
  sgstAmount: string | null;
  igstAmount: string | null;
  totalTax: string | null;
  totalAmount: string;
  paidAmount: string | null;
  isOverdue?: boolean;
  overdueDays?: number;
  dueAmount?: string;
  notes: string | null;
  storagePath: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  partyName?: string;
  /** Present on some invoice detail API responses */
  partyPhone?: string | null;
  partyGstin?: string | null;
  partyType?: string | null;
  /** Present on some invoice detail API responses */
  partyAddress?: string | null;
  partyCity?: string | null;
  partyState?: string | null;
  partyPostalCode?: string | null;
}

export interface InvoiceItem {
  id: number;
  itemId: number;
  stockEntryId: number;
  itemName?: string;
  hsnCode?: string | null;
  sacCode?: string | null;
  quantity: string;
  unitPrice: string;
  discountPercent: string | null;
  discountAmount: string | null;
  lineTotal: string;
  cgstRate: string | null;
  sgstRate: string | null;
  igstRate: string | null;
  cgstAmount: string | null;
  sgstAmount: string | null;
  igstAmount: string | null;
  createdAt: string;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  /** Merged timeline: legacy payments, receipt allocations, outbound refunds */
  payments: (LegacyInvoicePayment | InvoicePaymentLine)[];
}

export type InvoiceCommunicationChannel = "EMAIL" | "WHATSAPP" | "SMS" | "OTHER";

export interface InvoiceCommunicationRequest {
  channel?: InvoiceCommunicationChannel;
  metadata?: Record<string, unknown>;
}

export interface InvoiceCommunicationResponse {
  id: number;
  invoiceId: number;
  action: "SENT" | "REMINDER";
  channel: InvoiceCommunicationChannel | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface InvoiceCommunicationLatest {
  id: number;
  business_id: number;
  invoice_id: number;
  channel: InvoiceCommunicationChannel | null;
  action: "SENT" | "REMINDER";
  metadata: Record<string, unknown> | null;
  action_date: string;
  created_at: string;
}

export interface InvoiceCommunicationsSummary {
  invoiceId: number;
  sent: {
    today: boolean;
    latest: InvoiceCommunicationLatest | null;
  };
  reminder: {
    today: boolean;
    latest: InvoiceCommunicationLatest | null;
  };
}

/** Create/update an invoice row (product/service): identified by stockEntryId only (do not send itemId). All numeric fields are strings. */
export interface InvoiceItemInput {
  stockEntryId: number;
  quantity: string;
  unitPrice?: string;
  discountPercent?: string;
  discountAmount?: string;
}

export interface CreateInvoiceRequest {
  partyId: number;
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
  roundOffAmount?: string;
  items: InvoiceItemInput[];
}

/** PUT /invoices/:id — all fields optional; `items` if present replaces all lines (min 1). */
export interface UpdateInvoiceRequest {
  partyId?: number;
  invoiceType?: InvoiceType;
  invoiceDate?: string;
  /** Omit to leave unchanged; `null` clears due date */
  dueDate?: string | null;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
  roundOffAmount?: string;
  items?: InvoiceItemInput[];
}

/** Legacy inbound payment row (pre-receipts). */
export interface LegacyInvoicePayment {
  id: number;
  invoiceId?: number;
  amount: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  source?: "LEGACY_PAYMENT";
  receiptId?: null;
  receiptNumber?: null;
}

export type InvoicePaymentSource = "LEGACY_PAYMENT" | "RECEIPT_ALLOCATION" | "OUTBOUND_REFUND";

export interface InvoicePaymentLineBase {
  id: number;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type InvoicePaymentLine =
  | (InvoicePaymentLineBase & {
      source: "LEGACY_PAYMENT";
      receiptId?: null;
      receiptNumber?: null;
    })
  | (InvoicePaymentLineBase & {
      source: "RECEIPT_ALLOCATION";
      receiptId: number;
      receiptNumber: string;
    })
  | (InvoicePaymentLineBase & {
      source: "OUTBOUND_REFUND";
      outboundPaymentNumber: string;
    });

/** Normalize GET invoice payments (merged timeline). */
export function normalizeInvoicePaymentLine(
  raw: LegacyInvoicePayment | InvoicePaymentLine,
): InvoicePaymentLine {
  const s = raw.source;
  if (s === "RECEIPT_ALLOCATION" && "receiptId" in raw && raw.receiptId != null) {
    return raw as InvoicePaymentLine;
  }
  if (s === "OUTBOUND_REFUND" && "outboundPaymentNumber" in raw) {
    return raw as InvoicePaymentLine;
  }
  const r = raw as LegacyInvoicePayment;
  return {
    source: "LEGACY_PAYMENT",
    id: r.id,
    amount: r.amount,
    paymentMethod: r.paymentMethod,
    referenceNumber: r.referenceNumber,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

export interface RecordPaymentRequest {
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface FinalizeInvoiceResponse {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: string;
  paidAmount: string;
  finalizedAt: string;
}

export interface InvoicePdfResponse {
  invoiceId: number;
  invoiceNumber: string;
  downloadUrl: string | null;
  format: string;
  /** ISO date string when PDF URL is returned */
  generatedAt: string | null;
  message?: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  page: number;
  pageSize: number;
  /** Total number of invoices (for pagination) */
  count: number;
}

/** Response data for GET /invoices/next-number (and /invoices/next). */
export interface NextInvoiceNumberData {
  nextNumber: string;
  financialYear: string;
}
