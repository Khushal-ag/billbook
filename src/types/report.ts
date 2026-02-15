import type { InvoiceStatus } from "./invoice";

export interface SalesReportData {
  period: { startDate: string; endDate: string };
  totalAmount: string;
  totalTax: string;
  invoiceCount: number;
  data: SalesReportRow[];
}

export interface SalesReportRow {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  subTotal: string;
  taxAmount: string;
  totalAmount: string;
  status: InvoiceStatus;
}

export interface PartyOutstandingData {
  data: PartyOutstandingRow[];
}

export interface PartyOutstandingRow {
  partyId: number;
  partyName: string;
  totalInvoiced: string;
  totalPaid: string;
  outstanding: string;
}

export interface ProductSalesData {
  period: { startDate: string; endDate: string };
  data: ProductSalesRow[];
}

export interface ProductSalesRow {
  productId: number;
  productName: string;
  quantitySold: string;
  totalAmount: string;
}

export interface ExportData {
  format: string;
  exportedAt: string;
  period: { startDate: string; endDate: string };
  recordCount: number;
  data: unknown[];
  summary: { totalAmount: string; totalTax: string };
}
