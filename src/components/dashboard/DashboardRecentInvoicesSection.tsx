import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RecentInvoice } from "@/types/dashboard";

interface DashboardRecentInvoicesSectionProps {
  recentInvoices: RecentInvoice[];
  canCreateInvoice?: boolean;
}

export function DashboardRecentInvoicesSection({
  recentInvoices,
  canCreateInvoice = true,
}: DashboardRecentInvoicesSectionProps) {
  const allowNewSaleInvoice = canCreateInvoice === true;
  return (
    <section>
      <Card className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/15 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold">Recent sale activity</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest sale invoices and returns. Purchase bills live under purchases.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                {recentInvoices.length} shown
              </span>
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link href="/invoices">All sales</Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-8" asChild>
                <Link href="/invoices/purchases">Purchases</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-background/80">
            <table
              className="w-full min-w-[300px] text-sm"
              role="table"
              aria-label="Recent sale documents"
            >
              <thead className="sticky top-0 z-[1] bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Invoice
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Customer
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length > 0 ? (
                  recentInvoices.slice(0, 5).map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(inv.partyName?.charAt(0) ?? "?").toUpperCase()}
                          </span>
                          <span className="truncate font-medium">{inv.partyName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-14">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            No sale documents yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Create your first sale invoice to see it here.
                          </p>
                          {!allowNewSaleInvoice ? (
                            <p className="text-xs text-muted-foreground">
                              Finish your profile or renew access.{" "}
                              <Link
                                href="/profile"
                                className="font-medium text-primary underline underline-offset-2"
                              >
                                Profile
                              </Link>
                            </p>
                          ) : null}
                        </div>
                        {allowNewSaleInvoice ? (
                          <Button size="sm" asChild>
                            <Link href="/invoices/new?type=SALE_INVOICE">New sale invoice</Link>
                          </Button>
                        ) : (
                          <Button size="sm" type="button" disabled>
                            New sale invoice
                          </Button>
                        )}
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
