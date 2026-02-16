export interface DashboardData {
  business: DashboardBusiness;
  metrics: DashboardMetrics;
}

export interface DashboardBusiness {
  id: number;
  name: string;
  gstin: string | null;
  taxType: string;
}

export interface DashboardMetrics {
  totalInvoices: number;
  totalAmount: number;
  totalProducts: number;
  totalParties: number;
}
