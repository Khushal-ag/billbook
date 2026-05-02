import type { ReactNode } from "react";
import { cn } from "@/lib/core/utils";

/** Inline-size container so metric values can use `cqi` for fluid font sizing inside cards. */
export const fluidMetricShellClass = "min-w-0 max-w-full [container-type:inline-size]";

/** Performance snapshot KPI figure — scales down in narrow cells when amounts are long. */
export const fluidSnapshotValueClass =
  "min-w-0 max-w-full font-semibold tabular-nums leading-none tracking-tight text-[clamp(0.6875rem,calc(0.38rem+6.25cqi),1.75rem)]";

/** Larger headline figures (receivables / payables totals, balance cards). */
export const fluidSectionStatClass =
  "min-w-0 max-w-full font-semibold tabular-nums leading-tight text-[clamp(1rem,calc(0.5rem+4.25cqi),1.5rem)]";

/** Inline totals in dashboard ranking rows — avoids overflow without clipping digits when possible. */
export const fluidRowAmountClass =
  "min-w-0 max-w-full text-end font-semibold tabular-nums text-[clamp(0.65rem,calc(0.28rem+3.8cqi),0.875rem)]";

/** Reports hub KPI primary count. */
export const fluidReportsCountClass =
  "font-semibold tabular-nums tracking-tight text-[clamp(1.125rem,calc(0.45rem+5.5cqi),1.75rem)]";

/** Reports hub “Total ₹…” caption under count. */
export const fluidReportsTotalLineClass =
  "tabular-nums text-[clamp(0.65rem,calc(0.22rem+3.4cqi),0.875rem)] text-muted-foreground";

/** Inventory pulse stat figures (counts). */
export const fluidInventoryPulseValueClass =
  "font-semibold tabular-nums text-[clamp(1rem,calc(0.42rem+5cqi),1.5rem)]";

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
