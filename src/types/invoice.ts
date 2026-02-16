export type InvoiceStatus = "DRAFT" | "FINAL" | "CANCELLED";

export type PaymentMethod = "CASH" | "CHEQUE" | "UPI" | "BANK_TRANSFER" | "CARD";

export interface Invoice {
  id: number;
  businessId: number;
  invoiceNumber: string;
  financialYear: string | null;
  status: InvoiceStatus;
  partyId: number;
  invoiceDate: string;
  dueDate: string | null;
  subTotal: string;
  discountAmount: string | null;
  discountPercent: string | null;
  cgstAmount: string | null;
  sgstAmount: string | null;
  igstAmount: string | null;
  totalTax: string | null;
  totalAmount: string;
  paidAmount: string | null;
  notes: string | null;
  storagePath: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  /** Convenience — joined by backend */
  partyName?: string;
}

export interface InvoiceItem {
  id: number;
  productId: number;
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
  /** Convenience — joined by backend */
  productName?: string;
}

/** GET /invoices/:id */
export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceItemInput {
  productId: number;
  quantity: string;
  unitPrice: string;
  discountPercent?: string;
}

export interface CreateInvoiceRequest {
  partyId: number;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
  items: InvoiceItemInput[];
}

/** Only DRAFT invoices can be updated. Cannot modify items after creation. */
export interface UpdateInvoiceRequest {
  partyId?: number;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RecordPaymentRequest {
  amount: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface InvoicePdfResponse {
  invoiceId: number;
  invoiceNumber: string;
  downloadUrl: string | null;
  format: string;
  generatedAt: string | null;
  message?: string;
}

/** GET /invoices response */
export interface InvoiceListResponse {
  invoices: Invoice[];
  page: number;
  pageSize: number;
  count: number;
}
