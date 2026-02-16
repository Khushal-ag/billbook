import type { InvoiceStatus } from "./invoice";

export interface SalesReportData {
  period: { startDate: string; endDate: string };
  sales: SalesReportRow[];
  summary: {
    totalInvoices: number;
    totalAmount: string;
    totalTax: string;
    totalPaid: string;
    totalOutstanding: string;
  };
}

export interface SalesReportRow {
  date: string;
  invoiceNumber: string;
  partyName: string;
  totalAmount: string;
  totalTax: string;
  paidAmount: string;
  outstanding: string;
  status: InvoiceStatus;
}

export interface PartyOutstandingData {
  parties: PartyOutstandingRow[];
  summary: {
    totalParties: number;
    totalInvoiced: string;
    totalPaid: string;
    totalOutstanding: string;
  };
}

export interface PartyOutstandingRow {
  partyId: number;
  partyName: string;
  type: string;
  totalInvoiced: string;
  totalPaid: string;
  outstanding: string;
}

export interface ProductSalesData {
  period: { startDate: string; endDate: string };
  products: ProductSalesRow[];
  summary: {
    totalProducts: number;
    totalQuantity: string;
    totalAmount: string;
  };
}

export interface ProductSalesRow {
  productId: number;
  productName: string;
  unit: string;
  totalQuantity: string;
  totalAmount: string;
  avgPrice: string;
}

export interface ExportData {
  format: string;
  exportedAt: string;
  period: { startDate: string; endDate: string };
  recordCount: number;
  data: Array<{
    date: string;
    invoiceNumber: string;
    partyName: string;
    totalAmount: string;
    totalTax: string;
    paidAmount: string;
    outstanding: string;
    status: string;
  }>;
  summary: {
    totalInvoices: number;
    totalAmount: string;
    totalTax: string;
    totalPaid: string;
    totalOutstanding: string;
  };
}
