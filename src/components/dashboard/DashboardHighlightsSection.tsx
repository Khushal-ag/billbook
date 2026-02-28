import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import { formatCurrency } from "@/lib/utils";
import { EmptyChart } from "./dashboard-utils";
import type { TopItem, TopCustomer } from "@/types/dashboard";

interface DashboardHighlightsSectionProps {
  topItems: TopItem[];
  topCustomers: TopCustomer[];
}

export function DashboardHighlightsSection({
  topItems = [],
  topCustomers = [],
}: DashboardHighlightsSectionProps) {
  const isSimpleMode = useIsSimpleMode();
  const items = Array.isArray(topItems) ? topItems : [];
  const customers = Array.isArray(topCustomers) ? topCustomers : [];

  // Hide in simple mode completely
  if (isSimpleMode) return null;

  return (
    <section className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Items</CardTitle>
              <Link to="/items" className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {items.length > 0 ? (
              <div className="divide-y divide-border/60">
                {items.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-background/70"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground">{item.totalQuantity} sold</p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyChart text="No item data yet" height={150} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
              <Link to="/parties" className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {customers.length > 0 ? (
              <div className="divide-y divide-border/60">
                {customers.slice(0, 5).map((customer) => (
                  <div
                    key={customer.partyId}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-background/70"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-sm font-semibold text-accent">
                      {customer.partyName.charAt(0).toUpperCase()}
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
                ))}
              </div>
            ) : (
              <EmptyChart text="No customer data yet" height={150} />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
