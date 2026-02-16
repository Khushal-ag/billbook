import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      {/* Stat Cards Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      {/* Charts Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      {/* Second Row Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[280px] rounded-xl" />
        <Skeleton className="h-[280px] rounded-xl" />
      </div>
      {/* Top Customers Skeleton */}
      <Skeleton className="mb-6 h-[280px] rounded-xl" />
      {/* Recent Invoices Skeleton */}
      <Skeleton className="h-[350px] rounded-xl" />
    </div>
  );
}
