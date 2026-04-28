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
  sales:
    "border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-sm ring-1 ring-primary/[0.06]",
  purchase:
    "border-amber-500/25 bg-gradient-to-br from-amber-500/[0.09] via-card to-card shadow-sm ring-1 ring-amber-500/[0.06]",
  margin:
    "border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-card to-card shadow-sm ring-1 ring-violet-500/[0.05]",
  "profit-positive":
    "border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.12] via-card to-card shadow-sm ring-1 ring-emerald-500/[0.08]",
  "profit-negative":
    "border-red-500/25 bg-gradient-to-br from-red-500/[0.08] via-card to-card shadow-sm ring-1 ring-red-500/[0.06]",
  "profit-neutral": "border-border/80 bg-card shadow-sm",
  cash: "border-sky-500/25 bg-gradient-to-br from-sky-500/[0.09] via-card to-card shadow-sm ring-1 ring-sky-500/[0.06]",
  default: "border-border/80 bg-card shadow-sm",
};

const VALUE_CLASS: Record<KpiTone, string> = {
  sales: "text-primary",
  purchase: "text-amber-800 dark:text-amber-400",
  margin: "text-violet-700 dark:text-violet-300",
  "profit-positive": "text-emerald-700 dark:text-emerald-400",
  "profit-negative": "text-red-600 dark:text-red-400",
  "profit-neutral": "text-muted-foreground",
  cash: "text-sky-800 dark:text-sky-300",
  default: "text-foreground",
};

function Kpi({ label, value, tone }: { label: string; value: string; tone: KpiTone }) {
  return (
    <div
      className={cn("rounded-xl border p-4 transition-shadow hover:shadow-md", CARD_SHELL[tone])}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Today sales" value={todayStr} tone={todayStr === "—" ? "default" : "sales"} />
      <Kpi label="Month sales" value={formatCurrency(monthSales)} tone="sales" />
      <Kpi
        label="Month purchase"
        value={monthPurchase != null && monthPurchase !== "" ? formatCurrency(monthPurchase) : "—"}
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
  );
}
