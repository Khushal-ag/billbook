export interface DashboardData {
  business: DashboardBusiness;
  totalInvoices: number;
  totalRevenue: string | number;
  totalInvoicedGross?: string | number;
  totalCredited?: string | number;
  totalRevenueNet?: string | number;
  totalPaid: string | number;
  totalPaidFromLedger?: string | number;
  totalPaidFromInvoiceField?: string | number;
  totalOutstanding: string | number;
  totalReceivables?: string | number;
  totalAdvanceBalance?: string | number;
  netOutstanding?: string | number;
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
  revenue: string | number;
  invoiceCount: number;
}

export interface TopItem {
  itemId: number;
  itemName: string;
  totalRevenue: string | number;
  totalQuantity: string | number;
}

export interface TopCustomer {
  partyId: number;
  partyName: string;
  totalRevenue: string | number;
  invoiceCount: number;
}

export interface InvoiceStatusBreakdown {
  status: string;
  count: number;
  totalAmount: string | number;
}

export interface PaymentStatusBreakdown {
  status: "PAID" | "PARTIAL" | "UNPAID";
  count: number;
  totalAmount: string | number;
  totalPaid: string | number;
}

export interface RecentInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  totalAmount: string | number;
  paidAmount: string | number;
  status: string;
}
