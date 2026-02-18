import { formatCurrency } from "@/lib/utils";
import type { BalanceSummary } from "@/lib/party-ledger";

export function BalanceSummaryCards({ summary }: { summary: BalanceSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">Current Balance</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(summary.current)}</p>
      </div>
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">Receivable</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(summary.receivable)}</p>
      </div>
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">Advance</p>
        <p className="mt-1 text-sm font-semibold">{formatCurrency(summary.advance)}</p>
      </div>
    </div>
  );
}
