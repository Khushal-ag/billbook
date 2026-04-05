"use client";

import Link from "next/link";
import { ChevronRight, FileText, Info, Receipt, Wallet } from "lucide-react";
import { DashboardSectionHeader } from "@/components/dashboard/dashboard-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatCurrency } from "@/lib/utils";
import type { ReportsDashboardData } from "@/types/report";
import { reportDashboard } from "@/lib/report-labels";

interface ReportsDashboardSectionProps {
  data: ReportsDashboardData;
}

export function ReportsDashboardSection({ data }: ReportsDashboardSectionProps) {
  const { receipts, invoices, payouts, debt, payables } = data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section aria-labelledby="activity-heading">
        <DashboardSectionHeader
          id="activity-heading"
          title={reportDashboard.sectionActivity}
          description={reportDashboard.sectionActivityDescription}
          className="mb-4 sm:mb-5"
        />
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <KpiLinkCard
            href="/reports/receipt-register"
            label={reportDashboard.kpiReceipts}
            count={receipts.count}
            totalAmount={receipts.totalAmount}
            icon={Receipt}
          />
          <KpiLinkCard
            href="/reports/invoice-register"
            label={reportDashboard.kpiInvoices}
            count={invoices.count}
            totalAmount={invoices.totalAmount}
            icon={FileText}
          />
          <KpiLinkCard
            href="/reports/payout-register"
            label={reportDashboard.kpiPayouts}
            count={payouts.count}
            totalAmount={payouts.totalAmount}
            icon={Wallet}
          />
        </div>
      </section>

      <section aria-labelledby="balances-heading">
        <DashboardSectionHeader
          id="balances-heading"
          title={reportDashboard.sectionBalances}
          description={reportDashboard.sectionBalancesDescription}
          className="mb-4 sm:mb-5"
        />
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <BalanceLinkCard
            href="/reports/debt-register"
            title={reportDashboard.balanceReceivablesTitle}
            tooltip={reportDashboard.balanceReceivablesTooltip}
            amount={debt.totalReceivable}
            meta={reportDashboard.receivablesMeta(debt.debtorCount)}
            accent="emerald"
          />
          <BalanceLinkCard
            href="/reports/payables-register"
            title={reportDashboard.balancePayablesTitle}
            tooltip={reportDashboard.balancePayablesTooltip}
            amount={payables.totalPayable}
            meta={reportDashboard.payablesMeta(payables.creditorCount)}
            accent="rose"
          />
        </div>
      </section>
    </div>
  );
}

function KpiLinkCard({
  href,
  label,
  count,
  totalAmount,
  icon: Icon,
}: {
  href: string;
  label: string;
  count: number;
  totalAmount: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block h-full rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm ring-1 ring-black/[0.03] transition-all",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "dark:bg-card/80 dark:ring-white/[0.04]",
        "sm:p-5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.75rem]">
            {count}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            Total {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-colors group-hover:border-border group-hover:bg-muted/60">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-primary/90 group-hover:text-primary">
        {reportDashboard.viewReportCta} <span aria-hidden>→</span>
      </p>
    </Link>
  );
}

function BalanceLinkCard({
  href,
  title,
  tooltip,
  amount,
  meta,
  accent,
}: {
  href: string;
  title: string;
  tooltip: string;
  amount: string;
  meta: string;
  accent: "emerald" | "rose";
}) {
  const shell =
    accent === "emerald"
      ? "border-l-[3px] border-l-emerald-600/80 hover:border-l-emerald-600 bg-gradient-to-r from-emerald-500/[0.06] to-transparent dark:from-emerald-500/10"
      : "border-l-[3px] border-l-rose-600/80 hover:border-l-rose-600 bg-gradient-to-r from-rose-500/[0.06] to-transparent dark:from-rose-500/10";

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-sm ring-1 ring-black/[0.03] transition-colors hover:bg-muted/15 dark:ring-white/[0.04]",
        shell,
      )}
    >
      <Link
        href={href}
        className={cn(
          "group min-w-0 flex-1 p-4 pl-5 outline-none transition-colors sm:p-5 sm:pl-6",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </div>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.75rem]",
            accent === "emerald" && "text-emerald-950 dark:text-emerald-100",
            accent === "rose" && "text-rose-950 dark:text-rose-100",
          )}
        >
          {formatCurrency(amount)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
        <p className="mt-4 text-xs font-semibold text-primary/90 group-hover:text-primary">
          {reportDashboard.viewReportCta} <span aria-hidden>→</span>
        </p>
      </Link>
      <div className="flex shrink-0 flex-col border-l border-border/70 bg-muted/20">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex h-full min-h-[5.5rem] w-11 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-[6rem] sm:w-12"
              aria-label={`About ${title}`}
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[260px] text-xs leading-relaxed">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
