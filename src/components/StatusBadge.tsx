import type { InvoiceStatus } from "@/types/invoice";
import type { CreditNoteStatus } from "@/types/credit-note";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft-bg text-status-draft border-transparent",
  FINAL: "bg-status-final-bg text-status-final border-transparent",
  CANCELLED: "bg-status-cancelled-bg text-status-cancelled border-transparent",
  PAID: "bg-status-paid-bg text-status-paid border-transparent",
  PENDING: "bg-status-pending-bg text-status-pending border-transparent",
  OVERDUE: "bg-status-overdue-bg text-status-overdue border-transparent",
};

interface StatusBadgeProps {
  status: InvoiceStatus | CreditNoteStatus | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {status}
    </Badge>
  );
}
