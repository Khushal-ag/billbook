import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUIMode } from "@/contexts/UIModeContext";
import { formatCurrency } from "@/lib/utils";
import { EmptyChart } from "./dashboard-utils";
import type { TopProduct, TopCustomer } from "@/types/dashboard";

interface DashboardHighlightsSectionProps {
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
}

export function DashboardHighlightsSection({
  topProducts,
  topCustomers,
}: DashboardHighlightsSectionProps) {
  const { mode } = useUIMode();

  // Hide in simple mode completely
  if (mode === "simple") return null;

  return (
    <section className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top Products</CardTitle>
              <Link to="/products" className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {topProducts.length > 0 ? (
              <div className="divide-y divide-border/60">
                {topProducts.slice(0, 5).map((product, idx) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-background/70"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.totalQuantity} sold</p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyChart text="No product data yet" height={150} />
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
            {topCustomers.length > 0 ? (
              <div className="divide-y divide-border/60">
                {topCustomers.slice(0, 5).map((customer) => (
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
