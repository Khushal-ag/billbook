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
  totalRevenue: string | number;
  totalReceivables?: string | number | null;
  topCustomers: TopCustomer[];
  topCustomersByReceivable?: TopCustomer[];

  filter?: "monthly" | "overall" | null;
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
  grossMarginPercent?: string | number | null;
}

export interface DashboardBusiness {
  id: number;
  name: string;
  gstin: string | null;
  taxType: string;
}

export interface TopCustomer {
  partyId: number;
  partyName: string;
  totalRevenue?: string | number;
  invoiceCount?: number;
  totalReceivable?: string | number;
  totalOutstanding?: string | number;
}
