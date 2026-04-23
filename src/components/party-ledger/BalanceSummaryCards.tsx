import { formatCurrency } from "@/lib/core/utils";
import type { BalanceSummary } from "@/lib/party/party-ledger";
import { LedgerBalanceText } from "@/components/party-ledger/LedgerBalanceText";
import { Skeleton } from "@/components/ui/skeleton";

export function BalanceSummaryCards({
  summary,
  partyType = "CUSTOMER",
  isLoading = false,
}: {
  summary: BalanceSummary;
  partyType?: "CUSTOMER" | "SUPPLIER";
  isLoading?: boolean;
}) {
  const dueLabel = partyType === "SUPPLIER" ? "Payable" : "Receivable";

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">Current balance</p>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-14 w-36" />
            ) : (
              <LedgerBalanceText value={summary.current} size="lg" align="start" layout="stacked" />
            )}
          </div>
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">{dueLabel}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
              {formatCurrency(summary.receivable)}
            </p>
          )}
        </div>
        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">Advance</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <p className="mt-2 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
              {formatCurrency(summary.advance)}
            </p>
          )}
        </div>
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">
        These amounts are calculated from this party’s invoices, receipts, credits, and opening
        balance. If you entered an opening balance when creating the party, it is already part of
        receivable or advance—do not add it again separately.
      </p>
    </div>
  );
}
