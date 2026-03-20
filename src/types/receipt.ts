import type { PaymentMethod } from "@/types/invoice";

export interface ReceiptSummary {
  id: number;
  receiptNumber: string;
  totalAmount: string;
  unallocatedAmount: string;
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
  /** Sum already applied to invoices (when API sends it; else derivable from allocations). */
  allocatedAmount?: string;
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
}

export interface PutReceiptAllocationsRequest {
  allocations: { invoiceId: number; amount: string }[];
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
