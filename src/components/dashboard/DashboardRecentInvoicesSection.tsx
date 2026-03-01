import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RecentInvoice } from "@/types/dashboard";

interface DashboardRecentInvoicesSectionProps {
  recentInvoices: RecentInvoice[];
}

export function DashboardRecentInvoicesSection({
  recentInvoices,
}: DashboardRecentInvoicesSectionProps) {
  return (
    <section className="space-y-4">
      <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm">
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
                {recentInvoices.length > 0 ? (
                  recentInvoices.slice(0, 5).map((inv) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/60">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            No invoices yet
                          </p>
                          <p className="text-xs text-muted-foreground/90">
                            Create your first invoice to see it here.
                          </p>
                        </div>
                        <Link
                          to="/invoices?action=new"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Create invoice →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
