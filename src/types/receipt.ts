import type { PaymentMethod } from "@/types/invoice";

export interface ReceiptSummary {
  id: number;
  receiptNumber: string;
  totalAmount: string;
  /** Sum of invoice allocations plus {@link openingBalanceSettlementAmount} when provided by the API. */
  allocatedAmount?: string | null;
  unallocatedAmount: string;
  /** Part of this receipt attributed to historical customer debit opening (ledger unchanged). */
  openingBalanceSettlementAmount?: string | null;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  receivedAt: string;
  createdAt: string;
}

export interface ReceiptAllocationRow {
  id?: number;
  invoiceId: number;
  amount: string;
  invoiceNumber?: string;
  /** Present on some API shapes */
  allocatedAt?: string;
}

export interface OpenInvoiceForParty {
  id: number;
  invoiceNumber: string;
  invoiceType?: string;
  totalAmount: string;
  paidAmount?: string;
  dueAmount: string;
  status?: string;
  invoiceDate?: string;
}

export interface ReceiptDetail extends ReceiptSummary {
  partyId: number;
  partyName?: string;
  /**
   * Remaining historical receivable the party can still tag receipts against (same basis as server cap).
   * When `"0.00"` or absent meaning nothing left, the opening row is hidden—like invoices with no due.
   * If omitted (older API), the UI still shows the opening row when not an opening-advance receipt.
   */
  partyOpeningRemaining?: string | null;
  /** Net debit opening (receivable) for the party — “Total” column; aligns with ledger / `partyNetOpening` in 400 errors. */
  partyNetOpening?: string | null;
  /** Opening amount already tagged on other receipts — “Paid” column. */
  partyOpeningSettledOnOtherReceipts?: string | null;
  allocations: ReceiptAllocationRow[];
  openInvoicesForParty: OpenInvoiceForParty[];
}

export interface ReceiptListItem extends ReceiptSummary {
  partyId?: number;
  partyName?: string;
}

export interface ReceiptListResponse {
  receipts: ReceiptListItem[];
  page: number;
  pageSize: number;
  count: number;
}

export interface CreateReceiptRequest {
  partyId: number;
  totalAmount: string;
  paymentMethod: PaymentMethod | string;
  referenceNumber?: string | null;
  notes?: string | null;
  receivedAt?: string;
  allocations?: { invoiceId: number; amount: string }[];
  /** Omit or zero for normal receipts; must be "0.00" when paymentMethod is OPENING_BALANCE. */
  openingBalanceSettlementAmount?: string;
}

export interface PutReceiptAllocationsRequest {
  allocations: { invoiceId: number; amount: string }[];
  /**
   * Omit to keep the receipt’s current opening tag unchanged.
   * Send `"0.00"` explicitly to clear the tag.
   */
  openingBalanceSettlementAmount?: string;
}

/** POST /invoices/:id/payments success payload */
export interface RecordInvoicePaymentData {
  receipt: ReceiptSummary;
  allocatedToThisInvoice: string;
  invoicePaidAmountAfter: string;
  partyId: number;
}

function isRecordInvoicePaymentData(v: unknown): v is RecordInvoicePaymentData {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.receipt !== undefined &&
    typeof o.receipt === "object" &&
    typeof (o.receipt as ReceiptSummary).receiptNumber === "string"
  );
}

/** Supports new receipt response or legacy flat payment row */
export function parseInvoicePaymentResponse(data: unknown): RecordInvoicePaymentData | null {
  if (isRecordInvoicePaymentData(data)) return data;
  return null;
}
