import { memo } from "react";
import type { InvoiceStatus } from "@/types/invoice";
import type { CreditNoteStatus } from "@/types/credit-note";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** User-facing copy for known API status enums (invoice, credit note, payment-style rows). */
const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  FINAL: "Finalised",
  CANCELLED: "Cancelled",
  PAID: "Paid",
  PARTIAL: "Partial",
  UNPAID: "Unpaid",
  PENDING: "Pending",
  OVERDUE: "Overdue",
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-status-draft-bg text-status-draft border-transparent",
  FINAL: "bg-status-final-bg text-status-final border-transparent",
  CANCELLED: "bg-status-cancelled-bg text-status-cancelled border-transparent",
  PAID: "bg-status-paid-bg text-status-paid border-transparent",
  PARTIAL: "bg-status-pending-bg text-status-pending border-transparent",
  UNPAID: "bg-status-overdue-bg text-status-overdue border-transparent",
  PENDING: "bg-status-pending-bg text-status-pending border-transparent",
  OVERDUE: "bg-status-overdue-bg text-status-overdue border-transparent",
};

interface StatusBadgeProps {
  status: InvoiceStatus | CreditNoteStatus | string;
  className?: string;
  /** Extra context (e.g. cancellation reason) for screen readers / hover when parent doesn’t repeat it. */
  title?: string;
}

function labelForStatus(status: string): string {
  if (statusLabels[status]) return statusLabels[status];
  if (/^[A-Z0-9_]+$/.test(status)) {
    return status
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return status;
}

const StatusBadge = memo(function StatusBadge({ status, className, title }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      title={title}
      className={cn(
        "px-2 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {labelForStatus(status)}
    </Badge>
  );
});

export default StatusBadge;
