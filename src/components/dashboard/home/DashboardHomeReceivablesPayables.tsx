import { Building2, Users } from "lucide-react";
import {
  fluidMetricShellClass,
  fluidRowAmountClass,
  fluidSectionStatClass,
} from "@/components/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/core/utils";
import type { DashboardData, TopCustomer, TopVendor } from "@/types/dashboard";
import { dashboardToNumber } from "@/lib/business/dashboard-home";

interface DashboardHomeReceivablesPayablesProps {
  dashboard: DashboardData;
}

export function DashboardHomeReceivablesPayables({
  dashboard,
}: DashboardHomeReceivablesPayablesProps) {
  const formatOptionalCurrency = (value: string | number | null | undefined) =>
    value != null && value !== "" ? formatCurrency(value) : "—";
  const receivables = dashboardToNumber(dashboard.totalReceivables);
  const overdueRec = dashboard.overdueReceivables;
  const payables = dashboard.totalPayables;
  const overduePay = dashboard.overduePayables;
  const customers: TopCustomer[] = Array.isArray(dashboard.topCustomers)
    ? dashboard.topCustomers
    : [];
  const showReceivableRanking =
    Array.isArray(dashboard.topCustomersByReceivable) &&
    dashboard.topCustomersByReceivable.length > 0 &&
    customers.every((c) => c.totalRevenue == null || c.totalRevenue === "");
  const vendors: TopVendor[] = Array.isArray(dashboard.topVendors) ? dashboard.topVendors : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-2.5">
          <CardTitle className="text-base font-semibold">Receivables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap gap-6">
            <div className={cn(fluidMetricShellClass, "min-w-[8rem] flex-1")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p
                className={cn(fluidSectionStatClass, "mt-1 text-emerald-800 dark:text-emerald-400")}
              >
                {formatCurrency(receivables)}
              </p>
            </div>
            <div className={cn(fluidMetricShellClass, "min-w-[8rem] flex-1")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
              <p className={cn(fluidSectionStatClass, "mt-1 text-status-overdue")}>
                {formatOptionalCurrency(overdueRec)}
              </p>
            </div>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className="mb-2 text-sm font-semibold">
              {showReceivableRanking ? "Top customers (receivable)" : "Top customers"}
            </p>
            {customers.length > 0 ? (
              <ul className="space-y-2">
                {customers.slice(0, 6).map((c) => (
                  <li
                    key={c.partyId}
                    className={cn(
                      fluidMetricShellClass,
                      "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/35",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm font-medium">{c.partyName}</span>
                    </span>
                    <span className={fluidRowAmountClass}>
                      {formatCurrency(
                        c.totalRevenue ?? c.totalReceivable ?? c.totalOutstanding ?? 0,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No ranked customers yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-2.5">
          <CardTitle className="text-base font-semibold">Payables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap gap-6">
            <div className={cn(fluidMetricShellClass, "min-w-[8rem] flex-1")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className={cn(fluidSectionStatClass, "mt-1 text-amber-900 dark:text-amber-400")}>
                {formatOptionalCurrency(payables)}
              </p>
            </div>
            <div className={cn(fluidMetricShellClass, "min-w-[8rem] flex-1")}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
              <p className={cn(fluidSectionStatClass, "mt-1 text-status-overdue")}>
                {formatOptionalCurrency(overduePay)}
              </p>
            </div>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className="mb-2 text-sm font-semibold">Top vendors</p>
            {vendors.length > 0 ? (
              <ul className="space-y-2">
                {vendors.slice(0, 6).map((v) => (
                  <li
                    key={v.partyId}
                    className={cn(
                      fluidMetricShellClass,
                      "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/35",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm font-medium">{v.partyName}</span>
                    </span>
                    <span className={fluidRowAmountClass}>{formatCurrency(v.totalPayable)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No vendor ranking data yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
