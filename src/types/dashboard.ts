import type { InvoiceSummary } from "./invoice";

export interface DashboardData {
  totalSalesCurrentMonth: string;
  outstandingAmount: string;
  invoiceCountDraft: number;
  invoiceCountFinal: number;
  lowStockProducts: LowStockProduct[];
  recentInvoices: InvoiceSummary[];
  monthlySalesTrend: MonthlySales[];
  invoiceStatusBreakdown: StatusCount[];
}

export interface MonthlySales {
  month: string;
  amount: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  currentStock: string;
}
