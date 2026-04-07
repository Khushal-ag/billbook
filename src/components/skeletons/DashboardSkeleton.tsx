import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors `DashboardPageClient`: hero → quick stats → insights → highlights → recent activity. */
export default function DashboardSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <div className="space-y-8 sm:space-y-10">
        <section className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/25 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-52 sm:h-9 sm:w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-full sm:w-48" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-2xl sm:h-[108px]" />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-[300px] rounded-2xl lg:col-span-2" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
          <Skeleton className="h-[200px] rounded-2xl" />
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="min-h-[260px] rounded-2xl" />
            <Skeleton className="min-h-[260px] rounded-2xl" />
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/15 p-5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04] sm:p-6">
            <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full max-w-sm" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80">
              <div className="flex border-b border-border bg-muted/60 px-4 py-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mx-4 h-3 w-20 max-sm:hidden" />
                <Skeleton className="mr-4 h-3 w-14 max-md:hidden" />
                <Skeleton className="ml-auto h-3 w-16" />
                <Skeleton className="ml-4 h-3 w-12 max-sm:hidden" />
                <Skeleton className="ml-4 h-3 w-14" />
              </div>
              <div className="divide-y divide-border/60">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="h-4 flex-1 max-sm:hidden" />
                    <Skeleton className="h-4 w-20 shrink-0 max-md:hidden" />
                    <Skeleton className="ml-auto h-4 w-20 shrink-0" />
                    <Skeleton className="h-4 w-16 shrink-0 max-sm:hidden" />
                    <Skeleton className="h-4 w-14 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
