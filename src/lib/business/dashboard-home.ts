import { humanizeApiEnum } from "@/lib/core/utils";
import type {
  DashboardData,
  DashboardRecentLedgerRow,
  SalesPurchaseByMonth,
} from "@/types/dashboard";

type MarginDashboardPick = Pick<
  DashboardData,
  "grossMarginPercent" | "monthProfit" | "summaryPurchase" | "monthSales" | "totalRevenue"
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
  return {
    rows: combined.map((m: SalesPurchaseByMonth) => ({
      month: m.month,
      sales: dashboardToNumber(m.sales),
      purchase: dashboardToNumber(m.purchase),
    })),
    purchaseIsEstimated: false,
  };
}

export function buildRecentActivityRows(dashboard: DashboardData): DashboardRecentLedgerRow[] {
  return dashboard.recentLedgerActivity ?? [];
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

  const revenue = dashboard.monthSales ?? dashboard.totalRevenue;
  const revenueNum = dashboardToNumber(revenue);
  const purchaseNum =
    dashboard.summaryPurchase != null && dashboard.summaryPurchase !== ""
      ? dashboardToNumber(dashboard.summaryPurchase)
      : null;
  const profitFromApi = dashboard.monthProfit;
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
