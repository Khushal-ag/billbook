import type {
  PaymentStatusBreakdown,
  DashboardData,
  DashboardBusiness,
  InvoiceStatusBreakdown,
} from "@/types/dashboard";

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
  totalCredited: 0,
  netOutstanding: 0,
  totalReceivables: 0,
  totalAdvanceBalance: 0,
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

export type PaymentStatusItem = {
  name: PaymentStatusBreakdown["status"];
  value: number;
  count: number;
  fill: string;
};

function toNum(v: string | number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function buildPaymentStatusData(breakdown?: PaymentStatusBreakdown[]): {
  data: PaymentStatusItem[];
  total: number;
} {
  const data =
    breakdown?.map((item) => ({
      name: item.status,
      value: toNum(item.totalAmount),
      count: item.count,
      fill: PAYMENT_COLORS[item.status] ?? CHART_COLORS.quaternary,
    })) ?? [];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return { data, total };
}

const INVOICE_DOC_STATUS_COLORS: Record<string, string> = {
  DRAFT: "hsl(var(--chart-2))",
  FINAL: "hsl(142 76% 36%)",
  CANCELLED: "hsl(var(--muted-foreground) / 0.5)",
};

export type InvoiceStatusItem = {
  name: string;
  value: number;
  count: number;
  fill: string;
};

/** Sale-side documents only — amounts are totalAmount per status from API. */
export function buildInvoiceStatusData(breakdown?: InvoiceStatusBreakdown[]): {
  data: InvoiceStatusItem[];
  total: number;
} {
  const data =
    breakdown?.map((item) => ({
      name: item.status,
      value: toNum(item.totalAmount),
      count: item.count,
      fill: INVOICE_DOC_STATUS_COLORS[item.status] ?? CHART_COLORS.quaternary,
    })) ?? [];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return { data, total };
}
