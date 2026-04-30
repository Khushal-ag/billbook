import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatStockQuantity } from "@/lib/core/utils";
import type { DashboardData } from "@/types/dashboard";

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface DashboardHomeStockPulseProps {
  dashboard: DashboardData;
}

export function DashboardHomeStockPulse({ dashboard }: DashboardHomeStockPulseProps) {
  const s = dashboard.stockPulse;
  const low = s?.lowStockCount ?? 0;
  const out = s?.outOfStockCount ?? 0;
  const dead = s?.deadStockCount ?? 0;
  const fast = s?.fastMovingCount ?? 0;

  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Inventory pulse</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Quick counts for stock health. Open Stock or Items for full detail.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Low stock" value={formatStockQuantity(low)} href="/stock" />
        <StatCard label="Out of stock" value={formatStockQuantity(out)} href="/stock" />
        <StatCard label="Dead stock" value={formatStockQuantity(dead)} href="/items" />
        <StatCard label="Fast moving" value={formatStockQuantity(fast)} href="/items" />
      </div>
    </section>
  );
}
