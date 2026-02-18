import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyChart } from "./dashboard-utils";
import type { RecentInvoice } from "@/types/dashboard";

interface DashboardRecentInvoicesSectionProps {
  recentInvoices: RecentInvoice[];
}

export function DashboardRecentInvoicesSection({
  recentInvoices,
}: DashboardRecentInvoicesSectionProps) {
  return (
    <section className="space-y-4">
      <Card className="rounded-3xl border-muted/80 bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-md ring-1 ring-muted/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {recentInvoices.length} invoice{recentInvoices.length === 1 ? "" : "s"}
              </span>
              <Link to="/invoices" className="hover:text-foreground">
                View all →
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentInvoices.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-muted/50 bg-background/70">
              <table className="w-full text-sm" role="table" aria-label="Recent invoices">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Invoice</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Paid</th>
                    <th className="px-4 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {inv.partyName.charAt(0).toUpperCase()}
                          </span>
                          <span className="truncate font-medium">{inv.partyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyChart text="No invoices yet" height={150} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
