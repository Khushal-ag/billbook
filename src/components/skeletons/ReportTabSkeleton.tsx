import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/core/utils";

/** Result bar + header row + body rows — matches `ReportRegisterTableScroll` + `rr` table. */
function RegisterTableSkeleton({
  columns = "wide",
  rows = 8,
}: {
  /** `wide` = 5 header cells; `aging` = 6 (invoice aging table). */
  columns?: "wide" | "aging";
  rows?: number;
}) {
  const headerCellClasses =
    columns === "aging"
      ? [
          "h-3 w-16 shrink-0",
          "h-3 min-w-[6rem] flex-1 basis-[7rem]",
          "h-3 w-20 shrink-0",
          "h-3 w-20 shrink-0",
          "h-3 w-20 shrink-0 max-md:hidden",
          "h-3 w-14 shrink-0",
        ]
      : [
          "h-3 w-16 shrink-0",
          "h-3 min-w-[6rem] flex-1 basis-[7rem]",
          "h-3 w-20 shrink-0",
          "h-3 w-20 shrink-0 max-sm:hidden",
          "h-3 w-24 shrink-0",
        ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-4 py-2.5">
        <Skeleton className="h-3.5 w-44" />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-muted/50 px-4 py-3">
        {headerCellClasses.map((cellClass, i) => (
          <Skeleton key={i} className={cellClass} />
        ))}
      </div>
      <div className="divide-y divide-border/70">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <Skeleton className="h-4 w-28 shrink-0 sm:w-32" />
            <Skeleton className="h-4 min-w-[8rem] flex-1 basis-40" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0 max-sm:hidden" />
            <Skeleton className="h-4 w-24 shrink-0" />
            {columns === "aging" ? <Skeleton className="h-4 w-20 shrink-0 max-md:hidden" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export type ReportTabSkeletonLayout =
  | "register-table"
  /** Filter / search card + export toolbar + table (sales, purchase, receipt, payout, credit, debt). */
  | "register-with-toolbar"
  | "balance-register"
  | "aging"
  | "simple";

type ReportTabSkeletonProps = {
  /**
   * `register-table` — table-only shell (legacy).
   * `register-with-toolbar` — search/filter card + export row + table.
   * `balance-register` — summary + exports + table (payables).
   * `aging` — summary + exports + chart + chips + table.
   * `simple` — single block (escape hatch).
   */
  layout?: ReportTabSkeletonLayout;
  /** Only used when `layout` is `simple`. */
  height?: string;
};

export function ReportTabSkeleton({
  layout = "register-table",
  height = "h-80",
}: ReportTabSkeletonProps) {
  if (layout === "simple") {
    return <Skeleton className={cn(height, "w-full rounded-xl")} />;
  }

  if (layout === "register-with-toolbar") {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/70 bg-muted/30 px-4 py-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="px-4 py-3">
            <Skeleton className="mb-3 h-12 max-w-lg rounded-md" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full sm:col-span-2" />
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-border/60 pt-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-[8.5rem]" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <RegisterTableSkeleton rows={8} />
      </div>
    );
  }

  if (layout === "balance-register") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[5.25rem] w-full rounded-xl border border-border/80 shadow-sm sm:h-24" />
        <div className="flex flex-wrap justify-end gap-2">
          <Skeleton className="h-9 w-[8.5rem]" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <RegisterTableSkeleton rows={7} />
      </div>
    );
  }

  if (layout === "aging") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl border border-border/80 shadow-sm sm:h-11" />
        <div className="flex flex-wrap justify-end gap-2">
          <Skeleton className="h-9 w-[8.5rem]" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
          <Skeleton className="mb-3 h-5 w-48" />
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl border border-border/80" />
        <RegisterTableSkeleton columns="aging" rows={6} />
      </div>
    );
  }

  return <RegisterTableSkeleton rows={8} />;
}

/** Matches `ReportsDashboardSection`: section headers, KPI + balance grids. */
export function ReportsDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section>
        <div className="mb-4 space-y-2 sm:mb-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-[148px] rounded-xl border border-border/80 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]"
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 space-y-2 sm:mb-5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <Skeleton className="h-[148px] rounded-2xl border border-border/80 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]" />
          <Skeleton className="h-[148px] rounded-2xl border border-border/80 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]" />
        </div>
      </section>
    </div>
  );
}
