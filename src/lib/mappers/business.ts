import type { BusinessProfile } from "@/types/auth";
import type { DashboardData, TopItem } from "@/types/dashboard";

/** Normalize dashboard API response (totalItems/topItems, arrays). */
export function normalizeDashboard(raw: Record<string, unknown>): DashboardData {
  const d = raw as unknown as DashboardData & {
    totalItems?: number;
    totalProducts?: number;
    topItems?: Array<{
      itemId?: number;
      itemName?: string;
      totalRevenue?: number;
      totalQuantity?: number;
    }>;
  };
  const rawTopItems = Array.isArray(d.topItems) ? d.topItems : [];
  const topItems: TopItem[] = rawTopItems.map((i) => ({
    itemId: i.itemId ?? 0,
    itemName: i.itemName ?? "",
    totalRevenue: i.totalRevenue ?? 0,
    totalQuantity: i.totalQuantity ?? 0,
  }));
  return {
    ...d,
    totalItems: d.totalItems ?? d.totalProducts ?? 0,
    topItems,
    totalReceivables: typeof d.totalReceivables === "number" ? d.totalReceivables : undefined,
    totalAdvanceBalance:
      typeof d.totalAdvanceBalance === "number" ? d.totalAdvanceBalance : undefined,
    netOutstanding: typeof d.netOutstanding === "number" ? d.netOutstanding : undefined,
    revenueByMonth: Array.isArray(d.revenueByMonth) ? d.revenueByMonth : [],
    topCustomers: Array.isArray(d.topCustomers) ? d.topCustomers : [],
    invoiceStatusBreakdown: Array.isArray(d.invoiceStatusBreakdown) ? d.invoiceStatusBreakdown : [],
    paymentStatusBreakdown: Array.isArray(d.paymentStatusBreakdown) ? d.paymentStatusBreakdown : [],
    recentInvoices: Array.isArray(d.recentInvoices) ? d.recentInvoices : [],
  } as DashboardData;
}

/** Normalize business profile (legacy address/postalCode → street/pincode). */
export function normalizeBusinessProfile(raw: Record<string, unknown>): BusinessProfile {
  const r = raw as unknown as BusinessProfile & { address?: string; postalCode?: string };
  return {
    ...r,
    country: r.country ?? "India",
    street: r.street ?? r.address ?? null,
    area: r.area ?? null,
    pincode: r.pincode ?? r.postalCode ?? null,
    businessType: r.businessType ?? null,
    industryType: r.industryType ?? null,
    registrationType: r.registrationType ?? null,
    extraDetails: Array.isArray(r.extraDetails) ? r.extraDetails : null,
    financialYearStart: typeof r.financialYearStart === "number" ? r.financialYearStart : 4,
    profileCompletion: r.profileCompletion ?? undefined,
  } as BusinessProfile;
}
