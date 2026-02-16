import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceDetailSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
