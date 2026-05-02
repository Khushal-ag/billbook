import type { DashboardData, DashboardBusiness } from "@/types/dashboard";

export const EMPTY_DASHBOARD: DashboardData = {
  business: { id: 0, name: "", gstin: null, taxType: "GST" } as DashboardBusiness,
  totalRevenue: 0,
  topCustomers: [],
};
