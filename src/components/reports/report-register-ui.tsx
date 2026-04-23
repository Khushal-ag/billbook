import { Table2 } from "lucide-react";
import { cn } from "@/lib/core/utils";

/** Filter row(s) for date range, limit, extra actions — card on the page. */
export function ReportRegisterFilterCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("mb-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5", className)}
    >
      {children}
    </div>
  );
}

type ReportRegisterFilterGridProps = {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
};

/** Shared filter layout for all register pages. */
export function ReportRegisterFilterGrid({
  children,
  cols = 2,
  className,
}: ReportRegisterFilterGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4 xl:items-end",
        cols === 1 && "xl:grid-cols-1",
        cols === 2 && "xl:grid-cols-[minmax(0,1fr)_auto]",
        cols === 3 && "xl:grid-cols-[minmax(0,1fr)_auto_auto]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ReportRegisterFilterGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border/70 bg-muted/15 p-3 sm:p-4", className)}>
      {title ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Optional bar above the table: row count and truncation hint. */
export function ReportRegisterResultBar({
  count,
  rowLabel,
  limit,
}: {
  count: number;
  /** e.g. "receipts", "invoices" — plural, lowercase */
  rowLabel: string;
  limit?: number;
}) {
  const maybeTruncated = limit !== undefined && count > 0 && count >= limit;

  return (
    <div className="border-b border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{count}</span> {rowLabel}
      {maybeTruncated ? (
        <span className="text-amber-800/90 dark:text-amber-400/85">
          {" "}
          · Showing up to {limit} rows — raise the limit if you need more.
        </span>
      ) : null}
    </div>
  );
}

export function ReportRegisterEmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Table2 className="h-9 w-9 opacity-35" aria-hidden />
          <p className="max-w-sm text-sm leading-relaxed">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function ReportRegisterSummaryCard({
  variant,
  children,
}: {
  variant: "emerald" | "rose";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-4 text-sm shadow-sm",
        variant === "emerald" &&
          "border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/10",
        variant === "rose" && "border-rose-500/20 bg-rose-500/[0.06] dark:bg-rose-500/10",
      )}
    >
      {children}
    </div>
  );
}

/** Scroll + card shell; put thead sticky inside. */
export function ReportRegisterTableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      {children}
    </div>
  );
}

export const rr = {
  table: "w-full min-w-[880px] border-collapse text-sm",
  thead: "sticky top-0 z-[1] border-b border-border bg-muted/70 backdrop-blur-sm dark:bg-muted/80",
  th: "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  thRight:
    "whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  td: "px-4 py-3 align-middle text-foreground",
  tdMuted: "px-4 py-3 align-middle text-sm text-muted-foreground",
  tdRight: "px-4 py-3 text-right align-middle tabular-nums text-foreground",
  tdRightMuted: "px-4 py-3 text-right align-middle tabular-nums text-muted-foreground",
  tr: "border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/35",
  link: "font-medium text-primary underline-offset-4 hover:underline",
} as const;
