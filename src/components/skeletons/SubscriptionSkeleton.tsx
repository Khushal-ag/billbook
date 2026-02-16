import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="mb-6 h-40 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
