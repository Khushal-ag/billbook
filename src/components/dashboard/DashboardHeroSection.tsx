import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IndianRupee, Landmark, Scale, FileText } from "lucide-react";
import { partyLedgerBalanceInlineParts } from "@/lib/party/party-ledger-display";
import { formatCurrency } from "@/lib/core/utils";
import { HeroCard } from "./dashboard-utils";
import type { DashboardData } from "@/types/dashboard";

interface DashboardHeroSectionProps {
  greeting: string;
  dashboard: DashboardData;
  /** From GET /business/profile → profileCompletion.canCreateInvoice; false/undefined disables CTA. */
  canCreateInvoice?: boolean;
}

function toNumber(v: string | number | undefined | null): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeRevenueTrend(months: DashboardData["revenueByMonth"]): "up" | "down" | undefined {
  const arr = months ?? [];
  if (arr.length < 2) return undefined;
  const last = arr[arr.length - 1];
  const prior = arr[arr.length - 2];
  if (last == null || prior == null) return undefined;
  const latest = toNumber(last.revenue);
  const previous = toNumber(prior.revenue);
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

export function DashboardHeroSection({
  greeting,
  dashboard,
  canCreateInvoice = true,
}: DashboardHeroSectionProps) {
  const allowNewSaleInvoice = canCreateInvoice === true;
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
    ? `“Paid on invoices” (${formatCurrency(invoiceFieldPaid!)}) is only what you have matched to bills. “All payments recorded” (${formatCurrency(ledgerPaid)}) includes every receipt and similar credit—even amounts not yet applied to a specific invoice. They differ until you allocate receipts or record payments.`
    : "This total is all customer money recorded in the system (receipts, advances, and similar). The Paid column on each invoice updates when you link a receipt or record a payment—not simply when you finalize the invoice.";

  const outstandingHint =
    outstanding < 0
      ? "A negative figure means customers overall are in credit (for example advances or prepayments)—not that they owe you more."
      : "A positive figure is roughly what customers still owe you after advances and credits.";

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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sales Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{greeting}</span>
            <Link
              href="/invoices/purchases"
              className="inline-flex items-center rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
            >
              Purchase Bills →
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Reports →
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
          {allowNewSaleInvoice ? (
            <Button asChild size="lg" className="h-11 rounded-full px-6 shadow-sm">
              <Link href="/invoices/new?type=SALE_INVOICE">
                <span className="mr-1">+</span> New Sales Invoice
              </Link>
            </Button>
          ) : (
            <Button type="button" size="lg" className="h-11 rounded-full px-6 shadow-sm" disabled>
              <span className="mr-1">+</span> New Sales Invoice
            </Button>
          )}
          {!allowNewSaleInvoice ? (
            <p className="max-w-[220px] text-right text-[11px] text-muted-foreground">
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
          title="Payments recorded"
          value={formatCurrency(ledgerPaid)}
          subtitle={
            showPaymentReconcile
              ? `Paid on invoices: ${formatCurrency(invoiceFieldPaid!)}`
              : undefined
          }
          titleHint={paymentHint}
          icon={<Landmark className="h-5 w-5" />}
          variant="success"
        />
        <HeroCard
          title="Net balance outstanding"
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
