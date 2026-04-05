import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CircleHelp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type HeroCardVariant = "default" | "success" | "warning";

type HeroCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  /** Longer accounting context — shown in a tooltip on the title row (keeps the card scannable). */
  titleHint?: string;
  icon?: ReactNode;
  variant?: HeroCardVariant;
  trend?: "up" | "down";
  href?: string;
};

const HERO_VARIANT_STYLES: Record<HeroCardVariant, string> = {
  default: "text-foreground",
  success: "text-status-paid",
  warning: "text-status-overdue",
};

export function HeroCard({
  title,
  value,
  subtitle,
  titleHint,
  icon,
  variant = "default",
  trend,
  href,
}: HeroCardProps) {
  const valueBlock = (
    <>
      <p
        className={cn(
          "text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
          HERO_VARIANT_STYLES[variant],
        )}
      >
        {value}
      </p>
      {subtitle ? <p className="text-xs leading-snug text-muted-foreground">{subtitle}</p> : null}
    </>
  );

  return (
    <Card className="group rounded-2xl border border-border/80 bg-card/90 shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md dark:ring-white/[0.04]">
      <CardContent className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            {titleHint ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex shrink-0 rounded-full p-0.5 text-muted-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`About ${title}`}
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
                  {titleHint}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-medium",
                  trend === "up" ? "text-status-paid" : "text-status-overdue",
                )}
              >
                {trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trend === "up" ? "Up" : "Down"}
              </span>
            ) : null}
          </div>
          {href ? (
            <Link
              href={href}
              className="block rounded-md py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {valueBlock}
            </Link>
          ) : (
            valueBlock
          )}
        </div>
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-colors group-hover:border-border group-hover:bg-muted/70">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type QuickStatVariant = "default" | "success" | "warning";

type QuickStatProps = {
  label: string;
  value: string | number;
  href?: string;
  variant?: QuickStatVariant;
  children?: ReactNode;
};

const QUICK_STAT_VARIANT_STYLES: Record<QuickStatVariant, string> = {
  default: "text-foreground",
  success: "text-status-paid",
  warning: "text-status-overdue",
};

export function QuickStat({ label, value, href, variant = "default", children }: QuickStatProps) {
  const content = (
    <Card className="group h-full rounded-xl border border-border/80 bg-card/90 shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md dark:ring-white/[0.04]">
      <CardContent className="p-4 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "text-lg font-semibold tabular-nums tracking-tight sm:text-xl",
                QUICK_STAT_VARIANT_STYLES[variant],
              )}
            >
              {value}
            </p>
          </div>
          {children && (
            <div
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30",
                QUICK_STAT_VARIANT_STYLES[variant],
              )}
            >
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

export function DashboardSectionHeader({
  id,
  title,
  description,
  action,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
