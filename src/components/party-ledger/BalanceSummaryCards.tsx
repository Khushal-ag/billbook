import { formatCurrency } from "@/lib/utils";
import type { BalanceSummary } from "@/lib/party-ledger";
import { LedgerBalanceText } from "@/components/party-ledger/LedgerBalanceText";

export function BalanceSummaryCards({
  summary,
  partyType = "CUSTOMER",
}: {
  summary: BalanceSummary;
  partyType?: "CUSTOMER" | "SUPPLIER";
}) {
  const dueLabel = partyType === "SUPPLIER" ? "Payable" : "Receivable";

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs font-medium text-muted-foreground">Current balance</p>
        <div className="mt-2">
          <LedgerBalanceText value={summary.current} size="lg" align="start" layout="stacked" />
        </div>
      </div>
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs font-medium text-muted-foreground">{dueLabel}</p>
        <p className="mt-2 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
          {formatCurrency(summary.receivable)}
        </p>
      </div>
      <div className="rounded-md border bg-muted/20 p-3">
        <p className="text-xs font-medium text-muted-foreground">Advance</p>
        <p className="mt-2 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
          {formatCurrency(summary.advance)}
        </p>
      </div>
    </div>
  );
}
