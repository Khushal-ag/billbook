import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { PaymentStatusBreakdown, DashboardData, DashboardBusiness } from "@/types/dashboard";

/** Default dashboard shape when API returns no data — keeps dashboard UI visible with empty state. */
export const EMPTY_DASHBOARD: DashboardData = {
  business: { id: 0, name: "", gstin: null, taxType: "GST" } as DashboardBusiness,
  totalInvoices: 0,
  totalRevenue: 0,
  totalPaid: 0,
  totalOutstanding: 0,
  totalItems: 0,
  totalParties: 0,
  revenueByMonth: [],
  topItems: [],
  topCustomers: [],
  invoiceStatusBreakdown: [],
  paymentStatusBreakdown: [],
  recentInvoices: [],
  totalInvoicedGross: 0,
  totalRevenueNet: 0,
  netOutstanding: 0,
};

export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "hsl(142 76% 36%)",
  PARTIAL: "hsl(38 92% 50%)",
  UNPAID: "hsl(0 84% 60%)",
};

export const PAYMENT_ICONS = {
  PAID: CheckCircle2,
  PARTIAL: Clock,
  UNPAID: AlertTriangle,
} as const;

export type PaymentStatusItem = {
  name: PaymentStatusBreakdown["status"];
  value: number;
  count: number;
  fill: string;
};

export function buildPaymentStatusData(breakdown?: PaymentStatusBreakdown[]): {
  data: PaymentStatusItem[];
  total: number;
} {
  const data =
    breakdown?.map((item) => ({
      name: item.status,
      value: item.totalAmount,
      count: item.count,
      fill: PAYMENT_COLORS[item.status] ?? CHART_COLORS.quaternary,
    })) ?? [];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return { data, total };
}
