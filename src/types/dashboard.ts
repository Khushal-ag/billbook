export interface DashboardData {
  business: DashboardBusiness;
  totalInvoices: number;
  totalRevenue: number;
  totalInvoicedGross?: number;
  totalCredited?: number;
  totalRevenueNet?: number;
  totalPaid: number;
  totalPaidFromLedger?: number;
  totalPaidFromInvoiceField?: number;
  totalOutstanding: number;
  totalReceivables?: string;
  totalAdvanceBalance?: string;
  netOutstanding?: string;
  totalItems: number;
  totalParties: number;
  revenueByMonth: RevenueByMonth[];
  topItems: TopItem[];
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

export interface RevenueByMonth {
  month: string;
  revenue: number;
  invoiceCount: number;
}

export interface TopItem {
  itemId: number;
  itemName: string;
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
