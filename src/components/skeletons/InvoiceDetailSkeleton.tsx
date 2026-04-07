import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors invoice detail: back link, PageHeader + actions, summary card, details, lines, payments. */
export default function InvoiceDetailSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <Skeleton className="mb-4 h-4 w-36" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 max-w-[90vw]" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border">
        <Skeleton className="h-1.5 w-full rounded-none" />
        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-40" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="space-y-2 sm:text-right">
              <Skeleton className="h-3 w-20 sm:ml-auto" />
              <Skeleton className="h-5 w-32 sm:ml-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="mb-6 space-y-2">
        <Skeleton className="h-5 w-32" />
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex gap-4 border-b pb-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="mb-2 h-10 w-full" />
          ))}
        </div>
      </div>

      <Skeleton className="mb-6 h-36 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
