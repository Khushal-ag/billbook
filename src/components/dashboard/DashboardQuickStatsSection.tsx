import { Link } from "react-router-dom";
import { Package, Users, TrendingDown, TrendingUp } from "lucide-react";
import { QuickStat } from "./dashboard-utils";
import type { DashboardData } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";

interface DashboardQuickStatsSectionProps {
  dashboard: DashboardData;
}

export function DashboardQuickStatsSection({ dashboard }: DashboardQuickStatsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Business snapshot</h2>
        <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground">
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
        {dashboard.totalReceivables != null && (
          <QuickStat
            label="Receivables"
            value={formatCurrency(dashboard.totalReceivables)}
            variant="warning"
          >
            <TrendingDown className="h-4 w-4" />
          </QuickStat>
        )}
        {dashboard.totalAdvanceBalance != null && (
          <QuickStat
            label="Advance"
            value={formatCurrency(dashboard.totalAdvanceBalance)}
            variant="success"
          >
            <TrendingUp className="h-4 w-4" />
          </QuickStat>
        )}
      </div>
    </section>
  );
}
