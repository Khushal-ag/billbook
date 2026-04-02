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
      <p className={cn("text-xl font-semibold", HERO_VARIANT_STYLES[variant])}>{value}</p>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </>
  );

  return (
    <Card className="group rounded-3xl border bg-background/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-xs text-muted-foreground">{title}</p>
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground group-hover:bg-muted">
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
    <Card className="group rounded-2xl border bg-background/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={cn(
                "text-lg font-semibold tabular-nums",
                QUICK_STAT_VARIANT_STYLES[variant],
              )}
            >
              {value}
            </p>
          </div>
          {children && (
            <div className={cn("mt-0.5", QUICK_STAT_VARIANT_STYLES[variant])}>{children}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
