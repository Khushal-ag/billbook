import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { BusinessProfile, UpdateBusinessProfile, BusinessUser } from "@/types/auth";
import type { DashboardData, TopItem } from "@/types/dashboard";

/** API may return totalItems/topItems; normalize and ensure arrays. */
function normalizeDashboard(raw: Record<string, unknown>): DashboardData {
  const d = raw as DashboardData & {
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
    revenueByMonth: Array.isArray(d.revenueByMonth) ? d.revenueByMonth : [],
    topCustomers: Array.isArray(d.topCustomers) ? d.topCustomers : [],
    invoiceStatusBreakdown: Array.isArray(d.invoiceStatusBreakdown) ? d.invoiceStatusBreakdown : [],
    paymentStatusBreakdown: Array.isArray(d.paymentStatusBreakdown) ? d.paymentStatusBreakdown : [],
    recentInvoices: Array.isArray(d.recentInvoices) ? d.recentInvoices : [],
  } as DashboardData;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardData>("/business/dashboard");
      return normalizeDashboard(res.data as unknown as Record<string, unknown>);
    },
  });
}

/** Normalize GET /business/profile response (legacy address/postalCode → street/pincode). */
function normalizeBusinessProfile(raw: Record<string, unknown>): BusinessProfile {
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

export function useBusinessProfile() {
  return useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
      const res = await api.get<BusinessProfile>("/business/profile");
      return normalizeBusinessProfile(res.data as unknown as Record<string, unknown>);
    },
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBusinessProfile) => {
      const res = await api.put<BusinessProfile>("/business/profile", data);
      return normalizeBusinessProfile(res.data as unknown as Record<string, unknown>);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business-profile"] }),
  });
}

export function useBusinessUsers() {
  return useQuery({
    queryKey: ["business-users"],
    queryFn: async () => {
      const res = await api.get<BusinessUser[]>("/business/users");
      return res.data;
    },
    retry: false,
  });
}
