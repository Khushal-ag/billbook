import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HeroCardVariant = "default" | "success" | "warning";

type HeroCardProps = {
  title: string;
  value: string;
  subtitle?: string;
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
  icon,
  variant = "default",
  trend,
  href,
}: HeroCardProps) {
  const content = (
    <Card className="group rounded-3xl border bg-background/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            {trend && (
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
            )}
          </div>
          <p className={cn("text-xl font-semibold", HERO_VARIANT_STYLES[variant])}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground group-hover:bg-muted">
            {icon}
          </div>
        )}
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
