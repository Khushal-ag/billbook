import Link from "next/link";
import { Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSectionHeader } from "./dashboard-utils";
import { formatCurrency, formatStockQuantity } from "@/lib/utils";
import type { TopItem, TopCustomer } from "@/types/dashboard";

interface DashboardHighlightsSectionProps {
  topItems: TopItem[];
  topCustomers: TopCustomer[];
}

export function DashboardHighlightsSection({
  topItems = [],
  topCustomers = [],
}: DashboardHighlightsSectionProps) {
  const items = Array.isArray(topItems) ? topItems : [];
  const customers = Array.isArray(topCustomers) ? topCustomers : [];

  return (
    <section className="space-y-5">
      <DashboardSectionHeader
        title="Top performers"
        description="Best-selling items and customers from sale invoices and returns."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/15 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Top items</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-fit shrink-0 px-2 text-xs" asChild>
                <Link href="/items">View catalog</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/70">
              {items.length > 0 ? (
                items.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 px-1 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/25 sm:px-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold tabular-nums text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatStockQuantity(item.totalQuantity)} net qty (sales − returns)
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.totalRevenue)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl px-2 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">No items yet</p>
                    <p className="text-xs text-muted-foreground/90">
                      Add items and record sale invoices to see top performers here.
                    </p>
                  </div>
                  <Link href="/items" className="text-xs font-medium text-primary hover:underline">
                    Add items →
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/15 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Top customers</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-fit shrink-0 px-2 text-xs" asChild>
                <Link href="/parties">View parties</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border/70">
              {customers.length > 0 ? (
                customers.slice(0, 5).map((customer) => (
                  <div
                    key={customer.partyId}
                    className="flex items-center gap-3 px-1 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-muted/25 sm:px-2"
                  >
                    <span className="bg-primary/12 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary">
                      {(customer.partyName?.charAt(0) ?? "?").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{customer.partyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(customer.totalRevenue)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl px-2 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">No customers yet</p>
                    <p className="text-xs text-muted-foreground/90">
                      Create parties and sale-side invoices to see top customers here.
                    </p>
                  </div>
                  <Link
                    href="/parties"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Add parties →
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
