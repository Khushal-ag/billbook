import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IndianRupee, Landmark, Scale, FileText } from "lucide-react";
import { partyLedgerBalanceInlineParts } from "@/lib/party-ledger-display";
import { formatCurrency } from "@/lib/utils";
import { HeroCard } from "./dashboard-utils";
import type { DashboardData } from "@/types/dashboard";

interface DashboardHeroSectionProps {
  greeting: string;
  dashboard: DashboardData;
}

function toNumber(v: string | number | undefined | null): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeRevenueTrend(months: DashboardData["revenueByMonth"]): "up" | "down" | undefined {
  const arr = months ?? [];
  if (arr.length < 2) return undefined;
  const latest = toNumber(arr[arr.length - 1].revenue);
  const previous = toNumber(arr[arr.length - 2].revenue);
  if (latest === previous) return undefined;
  return latest > previous ? "up" : "down";
}

function netOutstandingAmount(d: DashboardData): number {
  return toNumber(d.netOutstanding ?? d.totalOutstanding);
}

const OUTSTANDING_EPS = 1e-6;

function netOutstandingValueDisplay(outstanding: number): ReactNode {
  if (Math.abs(outstanding) < OUTSTANDING_EPS) {
    return formatCurrency(0);
  }
  const { amountStr, label, labelClassName } = partyLedgerBalanceInlineParts(String(outstanding));
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span>{amountStr}</span>
      <span className={labelClassName}>{label}</span>
    </span>
  );
}

export function DashboardHeroSection({ greeting, dashboard }: DashboardHeroSectionProps) {
  const netRevenue = toNumber(dashboard.totalRevenueNet ?? dashboard.totalRevenue);
  const gross =
    dashboard.totalInvoicedGross != null ? toNumber(dashboard.totalInvoicedGross) : undefined;
  const credited = toNumber(dashboard.totalCredited ?? 0);
  const ledgerPaid = toNumber(dashboard.totalPaidFromLedger ?? dashboard.totalPaid);
  const invoiceFieldPaid =
    dashboard.totalPaidFromInvoiceField != null
      ? toNumber(dashboard.totalPaidFromInvoiceField)
      : undefined;
  const outstanding = netOutstandingAmount(dashboard);
  const showPaymentReconcile =
    invoiceFieldPaid != null && Math.abs(ledgerPaid - invoiceFieldPaid) > 0.01;

  let revenueSubtitle: string | undefined;
  if (credited > 0 && gross != null) {
    revenueSubtitle = `Gross ${formatCurrency(gross)} · Credits ${formatCurrency(credited)}`;
  } else if (gross != null && Math.abs(gross - netRevenue) > 0.01) {
    revenueSubtitle = `Gross ${formatCurrency(gross)}`;
  }

  const paymentHint = showPaymentReconcile
    ? `Ledger includes all party payment credits (advances, suppliers, etc.). On final sale invoices only, paid amount recorded is ${formatCurrency(invoiceFieldPaid!)}.`
    : "Sum of party-ledger payment credits for this business — includes advances and other payments, not only sale invoices.";

  const outstandingHint =
    outstanding < 0
      ? "Negative net means balance in favour of parties (e.g. advances or prepayments), not overdue customer debt."
      : "Positive net is what customers owe you on the ledger, net of advances.";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-6 shadow-sm ring-1 ring-black/[0.04] dark:from-card dark:to-muted/20 dark:ring-white/[0.06] sm:p-8">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Overview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sales dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{greeting}</span>
            <Link
              href="/invoices/purchases"
              className="inline-flex items-center rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
            >
              Purchase bills →
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Reports →
            </Link>
          </div>
        </div>
        <Button asChild size="lg" className="h-11 shrink-0 rounded-full px-6 shadow-sm">
          <Link href="/invoices?action=new">
            <span className="mr-1">+</span> New sale invoice
          </Link>
        </Button>
      </div>

      <div className="relative mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <HeroCard
          title="Net sales revenue"
          value={formatCurrency(netRevenue)}
          subtitle={revenueSubtitle}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={computeRevenueTrend(dashboard.revenueByMonth)}
          href="/reports"
        />
        <HeroCard
          title="Payments (ledger)"
          value={formatCurrency(ledgerPaid)}
          subtitle={
            showPaymentReconcile ? `Invoices: ${formatCurrency(invoiceFieldPaid!)}` : undefined
          }
          titleHint={paymentHint}
          icon={<Landmark className="h-5 w-5" />}
          variant="success"
        />
        <HeroCard
          title="Net outstanding (ledger)"
          value={netOutstandingValueDisplay(outstanding)}
          subtitle={
            outstanding < 0
              ? "Party credit balance"
              : outstanding > 0
                ? "Net receivable"
                : undefined
          }
          titleHint={outstanding !== 0 ? outstandingHint : undefined}
          icon={<Scale className="h-5 w-5" />}
          variant={outstanding > 0 ? "warning" : "default"}
        />
        <HeroCard
          title="Sale documents"
          value={String(dashboard.totalInvoices)}
          subtitle={`${dashboard.totalItems ?? 0} items · ${dashboard.totalParties ?? 0} parties`}
          icon={<FileText className="h-5 w-5" />}
          href="/invoices"
        />
      </div>
    </section>
  );
}
