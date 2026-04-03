import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IndianRupee, Landmark, Scale, FileText } from "lucide-react";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
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

function netOutstandingAmount(d: DashboardData): number {
  return toNumber(d.netOutstanding ?? d.totalOutstanding);
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
    <section className="rounded-3xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sales dashboard</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>{greeting}</span>
            <span className="text-muted-foreground/40" aria-hidden>
              ·
            </span>
            <Link
              href="/invoices/purchases"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Purchases →
            </Link>
          </div>
        </div>
        <Button asChild size="lg" className="h-11 shrink-0 rounded-full px-6">
          <Link href="/invoices?action=new">
            <span className="mr-1">+</span> New sale invoice
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeroCard
          title="Net sales revenue"
          value={formatCurrency(netRevenue)}
          subtitle={revenueSubtitle}
          icon={<IndianRupee className="h-5 w-5" />}
          trend={(dashboard.revenueByMonth ?? []).length > 1 ? "up" : undefined}
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
          value={outstanding < 0 ? formatSignedCurrency(outstanding) : formatCurrency(outstanding)}
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
