import { Building2, Users } from "lucide-react";
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
  const receivables = dashboardToNumber(dashboard.totalReceivables ?? dashboard.totalOutstanding);
  const overdueRec = dashboard.overdueReceivables;
  const payables = dashboard.totalPayables;
  const overduePay = dashboard.overduePayables;
  const customers: TopCustomer[] = Array.isArray(dashboard.topCustomers)
    ? dashboard.topCustomers
    : [];
  const vendors: TopVendor[] = Array.isArray(dashboard.topVendors) ? dashboard.topVendors : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        className={cn(
          "rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.03]",
          "border-l-4 border-l-emerald-600/70 dark:border-l-emerald-500/55",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Receivables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-400">
                {formatCurrency(receivables)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-status-overdue">
                {overdueRec != null && overdueRec !== "" ? formatCurrency(overdueRec) : "—"}
              </p>
            </div>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className="mb-2 text-sm font-medium">Top customers</p>
            {customers.length > 0 ? (
              <ul className="space-y-2">
                {customers.slice(0, 6).map((c) => (
                  <li
                    key={c.partyId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/35"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm font-medium">{c.partyName}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(
                        c.totalReceivable ?? c.totalOutstanding ?? c.totalRevenue ?? 0,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No ranked customers yet. Record sale invoices to see top customers here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.03]",
          "border-l-4 border-l-amber-600/75 dark:border-l-amber-500/55",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Payables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900 dark:text-amber-400">
                {payables != null && payables !== "" ? formatCurrency(payables) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-status-overdue">
                {overduePay != null && overduePay !== "" ? formatCurrency(overduePay) : "—"}
              </p>
            </div>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className="mb-2 text-sm font-medium">Top vendors</p>
            {vendors.length > 0 ? (
              <ul className="space-y-2">
                {vendors.slice(0, 6).map((v) => (
                  <li
                    key={v.partyId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/35"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate text-sm font-medium">{v.partyName}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(v.totalPayable)}
                    </span>
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
