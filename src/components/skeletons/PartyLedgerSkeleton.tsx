import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors `PartyLedgerPage`: PageHeader, `BalanceSummaryCards`, legend + payment row, `Tabs`, `PartyLedgerEntriesTable`. */
export default function PartyLedgerSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <Skeleton className="h-9 w-full max-w-lg" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-44 shrink-0 rounded-md" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-md border bg-muted/10 p-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-7 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-8 w-36 shrink-0 rounded-md" />
      </div>

      <div className="mt-5 grid h-10 w-full max-w-md grid-cols-2 gap-1 rounded-md bg-muted p-1">
        <Skeleton className="h-8 rounded-sm" />
        <Skeleton className="h-8 rounded-sm" />
      </div>

      <div className="mt-4 overflow-hidden rounded-md border">
        <div className="flex gap-3 border-b bg-muted/40 px-3 py-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-14 max-sm:hidden" />
          <Skeleton className="h-3 w-14 max-sm:hidden" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="divide-y divide-border/70">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16 shrink-0 max-sm:hidden" />
              <Skeleton className="h-4 w-16 shrink-0 max-sm:hidden" />
              <Skeleton className="h-4 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
