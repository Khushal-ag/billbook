import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type EmptyChartProps = {
  text: string;
  height?: number;
  /** Optional second line; default explains data will appear with usage */
  subtitle?: string;
};

export function EmptyChart({
  text,
  height = 200,
  subtitle = "Data will appear here once you have activity",
}: EmptyChartProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-muted/60 bg-muted/5 py-8 text-center"
      style={{ minHeight: height }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
        <BarChart2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
      <p className="text-xs text-muted-foreground/80">{subtitle}</p>
    </div>
  );
}

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
      to={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

type PaymentTooltipContentProps = {
  valueFormatter: (value: string | number) => string;
} & Omit<ComponentProps<typeof ChartTooltipContent>, "formatter">;

export function PaymentTooltipContent({ valueFormatter, ...props }: PaymentTooltipContentProps) {
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name) =>
        (() => {
          const normalized = Array.isArray(value) ? value[0] : value;
          const formatted = valueFormatter(
            typeof normalized === "number" || typeof normalized === "string"
              ? normalized
              : Number(normalized),
          );

          return (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-muted-foreground">{name}</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {formatted}
              </span>
            </div>
          );
        })()
      }
    />
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
      to={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
