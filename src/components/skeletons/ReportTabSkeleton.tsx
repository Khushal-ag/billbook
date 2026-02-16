import { Skeleton } from "@/components/ui/skeleton";

export function ReportTabSkeleton({ height = "h-80" }: { height?: string }) {
  return <Skeleton className={`${height} rounded-xl`} />;
}
