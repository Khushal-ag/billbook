export type InvoiceStatus = "DRAFT" | "FINAL" | "CANCELLED";

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  partyId: number;
  partyName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: string;
  discountAmount: string;
  discountPercent: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  balanceDue: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: number;
  productId: number;
  productName: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  cgst: string;
  sgst: string;
  igst: string;
  taxAmount: string;
  totalAmount: string;
}

export interface Invoice extends InvoiceSummary {
  items: InvoiceItem[];
  payments: Payment[];
}

export interface CreateInvoiceRequest {
  partyId: number;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  discountAmount?: string;
  discountPercent?: string;
  items: {
    productId: number;
    quantity: string;
    unitPrice: string;
    discountPercent?: string;
  }[];
}

export type UpdateInvoiceRequest = CreateInvoiceRequest;

export interface Payment {
  id: number;
  invoiceId: number;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
}

export interface RecordPaymentRequest {
  amount: string;
  paymentMethod: string;
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
