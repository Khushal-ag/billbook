import Link from "next/link";
import { Package, Users, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSectionHeader, QuickStat } from "./dashboard-utils";
import type { DashboardData } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface DashboardQuickStatsSectionProps {
  dashboard: DashboardData;
}

export function DashboardQuickStatsSection({ dashboard }: DashboardQuickStatsSectionProps) {
  const receivables = dashboard.totalReceivables ?? 0;
  const advanceBalance = dashboard.totalAdvanceBalance ?? 0;

  return (
    <section className="rounded-2xl border border-border/80 bg-card/40 p-5 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/30 dark:ring-white/[0.04] sm:p-6">
      <DashboardSectionHeader
        title="Products, people & balances"
        description="Items and parties are quick counts from your lists. Receivables and advances are running money totals—they already include any opening balance you entered for a party, so you should not add opening balance again on top."
        action={
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/reports">View reports</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <QuickStat label="Items" value={dashboard.totalItems} href="/items">
          <Package className="h-4 w-4" />
        </QuickStat>
        <QuickStat label="Parties" value={dashboard.totalParties} href="/parties">
          <Users className="h-4 w-4" />
        </QuickStat>
        <QuickStat label="Receivables" value={formatCurrency(receivables)} variant="warning">
          <TrendingDown className="h-4 w-4" />
        </QuickStat>
        <QuickStat
          label="Advances (to parties)"
          value={formatCurrency(advanceBalance)}
          variant="success"
        >
          <TrendingUp className="h-4 w-4" />
        </QuickStat>
      </div>
    </section>
  );
}
