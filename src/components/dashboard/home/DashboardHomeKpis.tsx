import { cn, formatCurrency } from "@/lib/core/utils";
import type { DashboardData } from "@/types/dashboard";
import { dashboardToNumber, resolveDashboardMarginDisplay } from "@/lib/business/dashboard-home";

type KpiTone =
  | "sales"
  | "purchase"
  | "margin"
  | "profit-positive"
  | "profit-negative"
  | "profit-neutral"
  | "cash"
  | "default";

const CARD_SHELL: Record<KpiTone, string> = {
  sales: "border-border/80 border-t-2 border-t-primary/45 bg-card shadow-sm",
  purchase: "border-border/80 border-t-2 border-t-amber-500/45 bg-card shadow-sm",
  margin: "border-border/80 border-t-2 border-t-violet-500/40 bg-card shadow-sm",
  "profit-positive": "border-border/80 border-t-2 border-t-emerald-500/45 bg-card shadow-sm",
  "profit-negative": "border-border/80 border-t-2 border-t-red-500/45 bg-card shadow-sm",
  "profit-neutral": "border-border/80 border-t-2 border-t-border bg-card shadow-sm",
  cash: "border-border/80 border-t-2 border-t-sky-500/45 bg-card shadow-sm",
  default: "border-border/80 border-t-2 border-t-border bg-card shadow-sm",
};

const VALUE_CLASS: Record<KpiTone, string> = {
  sales: "text-foreground",
  purchase: "text-foreground",
  margin: "text-foreground",
  "profit-positive": "text-emerald-700 dark:text-emerald-400",
  "profit-negative": "text-red-600 dark:text-red-400",
  "profit-neutral": "text-foreground",
  cash: "text-foreground",
  default: "text-foreground",
};

function Kpi({ label, value, tone }: { label: string; value: string; tone: KpiTone }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[92px] flex-col justify-between rounded-xl border px-3.5 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-[108px] sm:px-4 sm:py-4",
        CARD_SHELL[tone],
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold tabular-nums leading-none tracking-tight sm:mt-2 sm:text-[1.75rem]",
          VALUE_CLASS[tone],
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface DashboardHomeKpisProps {
  dashboard: DashboardData;
}

export function DashboardHomeKpis({ dashboard }: DashboardHomeKpisProps) {
  const today = dashboard.todaySales;
  const monthSales = dashboard.monthSales ?? dashboard.totalRevenueNet ?? dashboard.totalRevenue;
  const monthPurchase = dashboard.summaryPurchase;
  const marginStr = resolveDashboardMarginDisplay(dashboard);
  const cashBank = dashboard.cashAndBankBalance;
  const profitRaw = dashboard.monthProfit ?? dashboard.summaryProfit;
  const profitNum = profitRaw != null && profitRaw !== "" ? dashboardToNumber(profitRaw) : null;
  const profitStr = profitRaw != null && profitRaw !== "" ? formatCurrency(profitRaw) : "—";

  let profitTone: KpiTone = "profit-neutral";
  if (profitNum != null && Number.isFinite(profitNum)) {
    if (profitNum > 0) profitTone = "profit-positive";
    else if (profitNum < 0) profitTone = "profit-negative";
  }

  const todayStr = today != null && today !== "" ? formatCurrency(today) : "—";

  const marginToneResolved: KpiTone = marginStr === "—" ? "profit-neutral" : "margin";

  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Performance snapshot</h2>
      </div>
      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Today sales" value={todayStr} tone={todayStr === "—" ? "default" : "sales"} />
        <Kpi label="Month sales" value={formatCurrency(monthSales)} tone="sales" />
        <Kpi
          label="Month purchase"
          value={
            monthPurchase != null && monthPurchase !== "" ? formatCurrency(monthPurchase) : "—"
          }
          tone={monthPurchase != null && monthPurchase !== "" ? "purchase" : "default"}
        />
        <Kpi label="Margin" value={marginStr} tone={marginToneResolved} />
        <Kpi
          label="Net cashflow"
          value={cashBank != null && cashBank !== "" ? formatCurrency(cashBank) : "—"}
          tone={cashBank != null && cashBank !== "" ? "cash" : "default"}
        />
        <Kpi label="Profit" value={profitStr} tone={profitTone} />
      </div>
    </section>
  );
}
