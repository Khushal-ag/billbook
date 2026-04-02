import Link from "next/link";
import { Package, Users, TrendingDown, TrendingUp } from "lucide-react";
import { QuickStat } from "./dashboard-utils";
import type { DashboardData } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface DashboardQuickStatsSectionProps {
  dashboard: DashboardData;
}

export function DashboardQuickStatsSection({ dashboard }: DashboardQuickStatsSectionProps) {
  const receivables = dashboard.totalReceivables ?? 0;
  const advanceBalance = dashboard.totalAdvanceBalance ?? 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Catalog & ledger snapshot</h2>
          <p className="text-xs text-muted-foreground">
            Items and parties are active catalog counts. Balances are from the party ledger (all
            activity), not sale-only.
          </p>
        </div>
        <Link href="/reports" className="text-xs text-muted-foreground hover:text-foreground">
          View analytics →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickStat label="Items" value={dashboard.totalItems} href="/items">
          <Package className="h-4 w-4 text-muted-foreground" />
        </QuickStat>
        <QuickStat label="Parties" value={dashboard.totalParties} href="/parties">
          <Users className="h-4 w-4 text-muted-foreground" />
        </QuickStat>
        <QuickStat label="Receivables" value={formatCurrency(receivables)} variant="warning">
          <TrendingDown className="h-4 w-4" />
        </QuickStat>
        <QuickStat
          label="Advances (owed to parties)"
          value={formatCurrency(advanceBalance)}
          variant="success"
        >
          <TrendingUp className="h-4 w-4" />
        </QuickStat>
      </div>
    </section>
  );
}
