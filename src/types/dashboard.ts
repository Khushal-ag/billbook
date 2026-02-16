export interface DashboardData {
  business: DashboardBusiness;
  metrics: DashboardMetrics;
  revenueByMonth: RevenueByMonth[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  invoiceStatusBreakdown: InvoiceStatusBreakdown[];
  paymentStatusBreakdown: PaymentStatusBreakdown[];
  recentInvoices: RecentInvoice[];
}

export interface DashboardBusiness {
  id: number;
  name: string;
  gstin: string | null;
  taxType: string;
}

export interface DashboardMetrics {
  totalInvoices: number;
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalProducts: number;
  totalParties: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  invoiceCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
}

export interface TopCustomer {
  partyId: number;
  partyName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface InvoiceStatusBreakdown {
  status: string;
  count: number;
  totalAmount: number;
}

export interface PaymentStatusBreakdown {
  status: "PAID" | "PARTIAL" | "UNPAID";
  count: number;
  totalAmount: number;
  totalPaid: number;
}

export interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}
