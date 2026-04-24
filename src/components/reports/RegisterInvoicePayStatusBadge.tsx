import { cn } from "@/lib/core/utils";
import type { InvoiceRegisterPayStatus } from "@/lib/reports/invoice-register-filters";

export function RegisterInvoicePayStatusBadge({ status }: { status: InvoiceRegisterPayStatus }) {
  const cfg = {
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-900/35 dark:text-emerald-300 dark:border-emerald-700/50",
    PARTIAL:
      "bg-amber-100 text-amber-800 border-amber-200/80 dark:bg-amber-900/35 dark:text-amber-300 dark:border-amber-700/50",
    UNPAID:
      "bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-900/35 dark:text-rose-300 dark:border-rose-700/50",
  }[status];
  const label = { PAID: "Paid", PARTIAL: "Partial", UNPAID: "Unpaid" }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        cfg,
      )}
    >
      {label}
    </span>
  );
}
