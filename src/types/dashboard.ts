export interface SalesPurchaseByMonth {
  month: string;
  sales: string | number;
  purchase: string | number;
}

export interface TopVendor {
  partyId: number;
  partyName: string;
  totalPayable: string | number;
  documentCount?: number;
}

export interface DashboardRecentLedgerRow {
  id?: number | string;
  occurredAt: string;
  entryType: string;
  partyName: string;
  amount: string | number;
  mode: string | null;
}

export interface DashboardStockPulse {
  lowStockCount: number;
  outOfStockCount: number;
  deadStockCount: number;
  fastMovingCount: number;
}

export interface DashboardData {
  business: DashboardBusiness;
  totalInvoices: number;
  totalRevenue: string | number;
  totalInvoicedGross?: string | number;
  totalCredited?: string | number;
  totalRevenueNet?: string | number;
  totalPaid: string | number;
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

  snapshotDate?: string | null;
  todaySales?: string | number | null;
  monthSales?: string | number | null;
  totalPayables?: string | number | null;
  overdueReceivables?: string | number | null;
  overduePayables?: string | number | null;
  cashAndBankBalance?: string | number | null;
  monthProfit?: string | number | null;
  salesVsPurchaseByMonth?: SalesPurchaseByMonth[];
  topVendors?: TopVendor[];
  recentLedgerActivity?: DashboardRecentLedgerRow[];
  stockPulse?: DashboardStockPulse | null;
  summaryPurchase?: string | number | null;
  summaryProfit?: string | number | null;
  grossMarginPercent?: string | number | null;
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
  totalReceivable?: string | number;
  totalOutstanding?: string | number;
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
