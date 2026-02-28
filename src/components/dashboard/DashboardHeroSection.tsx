import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IndianRupee, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { HeroCard } from "./dashboard-utils";
import type { DashboardData } from "@/types/dashboard";

interface DashboardHeroSectionProps {
  greeting: string;
  totalPaid: number;
  dashboard: DashboardData;
}

export function DashboardHeroSection({
  greeting,
  totalPaid,
  dashboard,
}: DashboardHeroSectionProps) {
  return (
    <section className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Business overview</h1>
          <p className="text-sm text-muted-foreground">{greeting}</p>
        </div>
        <Button asChild size="lg" className="h-11 rounded-full px-6">
          <Link to="/invoices?action=new">
            <span className="mr-1">+</span> New Invoice
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <HeroCard
          title="Gross Invoiced"
          value={formatCurrency(dashboard.totalInvoicedGross ?? dashboard.totalRevenue)}
          subtitle={`Net: ${formatCurrency(dashboard.totalRevenueNet ?? dashboard.totalRevenue)}`}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={(dashboard.revenueByMonth ?? []).length > 1 ? "up" : undefined}
          href="/reports"
        />
        <HeroCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <HeroCard
          title="Outstanding"
          value={formatCurrency(dashboard.netOutstanding ?? String(dashboard.totalOutstanding))}
          icon={<TrendingDown className="h-5 w-5" />}
          variant={
            Number(dashboard.netOutstanding ?? dashboard.totalOutstanding) > 0
              ? "warning"
              : "default"
          }
        />
        <HeroCard
          title="Invoices"
          value={String(dashboard.totalInvoices)}
          subtitle={`${dashboard.totalItems ?? 0} items · ${dashboard.totalParties ?? 0} parties`}
          icon={<FileText className="h-5 w-5" />}
          href="/invoices"
        />
      </div>
    </section>
  );
}
