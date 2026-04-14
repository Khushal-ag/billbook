export type InvoiceStatus = "DRAFT" | "FINAL" | "CANCELLED";
export type InvoiceType = "SALE_INVOICE" | "SALE_RETURN" | "PURCHASE_INVOICE" | "PURCHASE_RETURN";

export type PaymentMethod = "CASH" | "CHEQUE" | "UPI" | "BANK_TRANSFER" | "CARD";

export interface Invoice {
  id: number;
  businessId: number;
  invoiceNumber: string;
  financialYear: string | null;
  status: InvoiceStatus;
  /** Present on list/detail when status is `CANCELLED`. */
  cancellationReason?: string | null;
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
  /** When API persists it: margin % used when creating purchase invoice lines. */
  sellingPriceMarginPercent?: string | null;
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
  /** `SALE_RETURN` / `PURCHASE_RETURN`: original invoice id when linked (cumulative return caps). */
  sourceInvoiceId?: number | null;
  /** When API embeds it: original invoice’s display number (avoids an extra fetch on returns). */
  sourceInvoiceNumber?: string | null;
  /** Selected consignee id snapshot source (null means party primary address). */
  partyConsigneeId?: number | null;
  consigneeName?: string | null;
  consigneePhone?: string | null;
  consigneeEmail?: string | null;
  consigneeAddress?: string | null;
  consigneeCity?: string | null;
  consigneeState?: string | null;
  consigneePostalCode?: string | null;
  /** API helper labels for customer/vendor contexts. */
  partyRoleLabel?: "Customer" | "Vendor";
  addressRoleLabel?: "Delivery Address" | "Vendor Address";
  /** Vendor’s bill reference (purchase flows). Absent on older API responses. */
  originalBillNumber?: string | null;
  /** Vendor bill date from API (ISO date or datetime). */
  originalBillDate?: string | null;
  /** Net payment terms in days (purchase flows). */
  paymentTermsDays?: number | null;
}

export interface InvoiceItem {
  id: number;
  /** Null for vendor-only purchase lines not linked to catalog. */
  itemId: number | null;
  /** Null when the line is not linked to a stock batch. */
  stockEntryId: number | null;
  itemName?: string;
  hsnCode?: string | null;
  sacCode?: string | null;
  isTaxable?: boolean | null;
  quantity: string;
  unitPrice: string;
  /** Purchase lines: selling price per unit captured at bill time (when supported by API). */
  sellingPrice?: string | null;
  discountPercent: string | null;
  discountAmount: string | null;
  lineTotal: string;
  cgstRate: string | null;
  sgstRate: string | null;
  igstRate: string | null;
  cgstAmount: string | null;
  sgstAmount: string | null;
  igstAmount: string | null;
  /** Return docs: `invoice_items.id` on the original invoice line when linked. */
  sourceInvoiceItemId?: number | null;
  /** Finalized source sale/purchase invoice lines: qty already returned elsewhere (GET). */
  quantityAlreadyReturned?: string | null;
  /** Finalized source sale/purchase invoice lines: max qty still returnable (GET). */
  quantityReturnableRemaining?: string | null;
  createdAt: string;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  /** Merged timeline: legacy payments, receipt allocations, outbound refunds */
  payments: (LegacyInvoicePayment | InvoicePaymentLine)[];
}

export type InvoiceCommunicationChannel = "EMAIL" | "WHATSAPP" | "SMS" | "OTHER";

/** POST mark-sent / mark-reminder — only optional metadata; channel is server-defined. */
export interface InvoiceMarkCommunicationRequest {
  metadata?: Record<string, unknown>;
}

/** POST mark-sent / mark-reminder success payload */
export interface InvoiceMarkCommunicationResponse {
  communication: {
    id: number;
    businessId: number;
    invoiceId: number;
    channel: InvoiceCommunicationChannel | string;
    action: "REMINDER" | "SENT";
    metadata: unknown;
    actionDate: string;
    createdAt: string;
  };
  delivery: {
    channel: InvoiceCommunicationChannel | string;
    outcome: "sent" | "already_recorded_today" | "skipped_integration_pending";
    to?: string;
    messagePreview?: string;
    message?: string;
  };
}

/** GET /invoices/:id/communications — fields used by the app */
export interface InvoiceCommunicationsSummary {
  invoiceId: number;
  sent: { today: boolean };
  reminder: { today: boolean };
}

/**
 * Create/update invoice line (`items[]`). Rules are enforced server-side by `invoiceType`.
 * - `SALE_INVOICE`: send `stockEntryId`; do **not** send `itemId` or `sellingPrice`.
 * - `SALE_RETURN` linked to a `SALE_INVOICE` (STOCK lines): send `stockEntryId`, `sourceInvoiceItemId`, and `itemId` matching the source line (omit `itemId` for SERVICE lines).
 * - Purchase (`PURCHASE_INVOICE`): do **not** send `stockEntryId`; send `itemName` + rates; optional `itemId` and `sellingPrice`.
 * - `PURCHASE_RETURN` + catalog **STOCK** line: send `stockEntryId` (batch being returned). Omit for SERVICE lines. Finalize reduces that batch; **400** if missing where required, **409** if not enough in batch.
 * - `SALE_RETURN` with source link: send `stockEntryId` matching the original sale line’s batch so the return books to that batch.
 * - `PURCHASE_INVOICE`: lines get `stockEntryId` after **finalize** when batches are created — refresh invoice detail and stock UIs after finalize.
 * - Link returns with `sourceInvoiceId` on the document and `sourceInvoiceItemId` per line when matching the source bill.
 */
export interface InvoiceItemInput {
  /** `SALE_*`; `PURCHASE_RETURN` STOCK lines (batch to return). Not used for SERVICE purchase returns. */
  stockEntryId?: number;
  quantity: string;
  unitPrice?: string;
  discountPercent?: string;
  discountAmount?: string;
  /** Purchase flows: line label; required for purchase documents. */
  itemName?: string;
  hsnCode?: string;
  sacCode?: string;
  isTaxable?: boolean;
  cgstRate?: string;
  sgstRate?: string;
  igstRate?: string;
  /**
   * Purchase lines; `PURCHASE_RETURN` STOCK lines; **`SALE_RETURN`** lines linked to a source sale (STOCK only) — must match source `invoice_items.item_id`.
   * Omit for `SALE_INVOICE` and for SERVICE sale returns.
   */
  itemId?: number;
  /**
   * Purchase only: intended selling rate per unit (excl. line GST), same money rules as `unitPrice`; omit or ≥ 0.
   */
  sellingPrice?: string;
  /**
   * `SALE_RETURN` / `PURCHASE_RETURN` with `sourceInvoiceId`: original line’s `invoice_items.id` (and `stockEntryId` when applicable).
   */
  sourceInvoiceItemId?: number;
}

export interface CreateInvoiceRequest {
  partyId: number;
  consigneeId?: number | null;
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
  roundOffAmount?: string;
  /** Purchase invoice: non-negative decimal string (UI requires a value; often prefilled from business settings). */
  sellingPriceMarginPercent?: string;
  /** `SALE_RETURN` / `PURCHASE_RETURN`: original invoice id (optional; enables cumulative return caps). */
  sourceInvoiceId?: number;
  /** Purchase invoice only; omit for other types. */
  originalBillNumber?: string;
  originalBillDate?: string;
  paymentTermsDays?: number;
  items: InvoiceItemInput[];
}

/** PUT /invoices/:id — all fields optional; `items` if present replaces all lines (min 1). */
export interface UpdateInvoiceRequest {
  partyId?: number;
  consigneeId?: number | null;
  invoiceType?: InvoiceType;
  invoiceDate?: string;
  /** Omit to leave unchanged; `null` clears due date */
  dueDate?: string | null;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
  roundOffAmount?: string;
  /** Purchase documents: set `null` to clear document-level margin override. */
  sellingPriceMarginPercent?: string | null;
  /** Return types: set `null` to clear linkage. */
  sourceInvoiceId?: number | null;
  /** `PURCHASE_INVOICE` / `PURCHASE_RETURN` only; `null` clears. Omit for sale types. */
  originalBillNumber?: string | null;
  originalBillDate?: string | null;
  paymentTermsDays?: number | null;
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

/** Outbound payment row returned after POST /invoices/:id/supplier-payments */
export interface SupplierPaymentRecord {
  id: number;
  category: "PARTY_PAYMENT";
  paymentNumber: string | null;
  partyId: number | null;
  invoiceId: number | null;
  amount: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  payeeName: string | null;
  expenseCategory: string | null;
  createdAt: string;
}

/** `data` from POST /invoices/:id/supplier-payments (201) */
export interface RecordSupplierPaymentData {
  payment: SupplierPaymentRecord;
  allocatedToThisInvoice: string;
  invoicePaidAmountAfter: string;
  partyId: number;
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
  /** Type used for the preview (resolved default if query param omitted). */
  invoiceType: InvoiceType;
}
