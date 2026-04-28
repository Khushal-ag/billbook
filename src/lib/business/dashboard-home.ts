import { humanizeApiEnum } from "@/lib/core/utils";
import type {
  DashboardData,
  DashboardRecentLedgerRow,
  RecentInvoice,
  RevenueByMonth,
  SalesPurchaseByMonth,
} from "@/types/dashboard";

type MarginDashboardPick = Pick<
  DashboardData,
  | "grossMarginPercent"
  | "summaryProfit"
  | "monthProfit"
  | "summaryPurchase"
  | "monthSales"
  | "totalRevenueNet"
  | "totalRevenue"
>;

export function dashboardToNumber(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMarginPercent(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = dashboardToNumber(v);
  if (!Number.isFinite(n)) return "—";
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

export function snapshotLabelDate(dashboard: DashboardData): Date {
  if (dashboard.snapshotDate) {
    const d = new Date(dashboard.snapshotDate);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

type SalesPurchaseChartRow = {
  month: string;
  sales: number;
  purchase: number;
};

export function buildSalesPurchaseChartData(dashboard: DashboardData): {
  rows: SalesPurchaseChartRow[];
  purchaseIsEstimated: boolean;
} {
  const combined = dashboard.salesVsPurchaseByMonth ?? [];
  if (combined.length > 0) {
    return {
      rows: combined.map((m: SalesPurchaseByMonth) => ({
        month: m.month,
        sales: dashboardToNumber(m.sales),
        purchase: dashboardToNumber(m.purchase),
      })),
      purchaseIsEstimated: false,
    };
  }
  const months = dashboard.revenueByMonth ?? [];
  return {
    rows: months.map((m: RevenueByMonth) => ({
      month: m.month,
      sales: dashboardToNumber(m.revenue),
      purchase: 0,
    })),
    purchaseIsEstimated: true,
  };
}

export function buildRecentActivityRows(dashboard: DashboardData): DashboardRecentLedgerRow[] {
  const fromApi = dashboard.recentLedgerActivity ?? [];
  if (fromApi.length > 0) return fromApi;

  const inv = dashboard.recentInvoices ?? [];
  return inv.slice(0, 12).map(
    (r: RecentInvoice): DashboardRecentLedgerRow => ({
      id: r.id,
      occurredAt: r.invoiceDate,
      entryType: "SALE_INVOICE",
      partyName: r.partyName ?? "—",
      amount: r.totalAmount,
      mode: null,
    }),
  );
}

export function ledgerTypeLabel(entryType: string): string {
  const t = entryType.trim();
  if (!t) return "—";
  const map: Record<string, string> = {
    SALE_INVOICE: "Sale",
    SALE_RETURN: "Sale return",
    PURCHASE_INVOICE: "Purchase",
    PURCHASE_RETURN: "Purchase return",
    PARTY_PAYMENT: "Payment",
    PARTY_RECEIPT: "Receipt",
    CREDIT_NOTE: "Credit note",
    DEBIT_NOTE: "Debit note",
    OPENING_BALANCE: "Opening balance",
  };
  return map[t] ?? humanizeApiEnum(t);
}

export type ActivityTabFilter = "all" | "sales" | "purchases" | "payments";

export function filterActivityRows(
  rows: DashboardRecentLedgerRow[],
  tab: ActivityTabFilter,
): DashboardRecentLedgerRow[] {
  if (tab === "all") return rows;
  const norm = (e: string) => e.trim().toUpperCase();
  return rows.filter((r) => {
    const e = norm(r.entryType);
    if (tab === "sales") return e.includes("SALE") || e === "CREDIT_NOTE";
    if (tab === "purchases") return e.includes("PURCHASE") || e === "DEBIT_NOTE";
    if (tab === "payments")
      return (
        e === "PARTY_PAYMENT" ||
        e === "PARTY_RECEIPT" ||
        e.includes("PAYMENT") ||
        e.includes("RECEIPT")
      );
    return true;
  });
}

export function resolveDashboardMarginDisplay(dashboard: MarginDashboardPick): string {
  const margin = dashboard.grossMarginPercent;
  if (margin != null && margin !== "") return formatMarginPercent(margin);

  const revenue = dashboard.monthSales ?? dashboard.totalRevenueNet ?? dashboard.totalRevenue;
  const revenueNum = dashboardToNumber(revenue);
  const purchaseNum =
    dashboard.summaryPurchase != null && dashboard.summaryPurchase !== ""
      ? dashboardToNumber(dashboard.summaryPurchase)
      : null;
  const profitFromApi = dashboard.summaryProfit ?? dashboard.monthProfit;
  const profitNum =
    profitFromApi != null && profitFromApi !== ""
      ? dashboardToNumber(profitFromApi)
      : purchaseNum != null && Number.isFinite(purchaseNum)
        ? revenueNum - purchaseNum
        : null;

  if (
    profitNum != null &&
    Number.isFinite(profitNum) &&
    revenueNum > 0 &&
    Number.isFinite(revenueNum)
  ) {
    return formatMarginPercent((profitNum / revenueNum) * 100);
  }
  return "—";
}
