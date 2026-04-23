import { Download, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/DateRangePicker";
import { PartyLedgerEntriesTable } from "@/components/party-ledger/PartyLedgerEntriesTable";
import { partyLedgerBalanceInlineParts } from "@/lib/party/party-ledger-display";
import { cn, formatCurrency } from "@/lib/core/utils";
import type { StatementJsonData, StatementPdfData } from "@/lib/party/party-ledger";

interface StatementPanelProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onLoadStatement: () => void;
  onGeneratePdf: () => void;
  isFetching: boolean;
  statement?: StatementJsonData | null;
  pdf?: StatementPdfData | null;
}

export function StatementPanel({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onLoadStatement,
  onGeneratePdf,
  isFetching,
  statement,
  pdf,
}: StatementPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadStatement}
            className="w-full sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Load
          </Button>
          <Button type="button" onClick={onGeneratePdf} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {isFetching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {statement && (
        <div className="space-y-3">
          <StatementPeriodSummary statement={statement} />

          <PartyLedgerEntriesTable entries={statement.entries} variant="statement" />
        </div>
      )}

      {pdf && (
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          {pdf.storageConfigured ? (
            <div className="flex items-center justify-between gap-3">
              <span>PDF ready.</span>
              {pdf.downloadUrl && (
                <Button asChild size="sm" variant="outline">
                  <a href={pdf.downloadUrl} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <span>PDF storage is not configured.</span>
          )}
        </div>
      )}
    </div>
  );
}

function StatementPeriodSummary({ statement }: { statement: StatementJsonData }) {
  const opening = partyLedgerBalanceInlineParts(statement.openingBalance);
  const closing = partyLedgerBalanceInlineParts(statement.closingBalance);

  return (
    <div className="rounded-md border border-border bg-muted/10 px-3 py-3 text-sm" role="note">
      <dl className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Opening</dt>
          <dd className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {opening.amountStr}
            </span>
            <span className={cn("min-w-0 shrink", opening.labelClassName)}>{opening.label}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Closing</dt>
          <dd className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {closing.amountStr}
            </span>
            <span className={cn("min-w-0 shrink", closing.labelClassName)}>{closing.label}</span>
          </dd>
        </div>
        <div className="min-w-0 sm:border-l sm:border-border sm:pl-6">
          <dt className="text-xs font-medium text-muted-foreground">Movement this period</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
              <span className="text-xs font-medium text-muted-foreground">Debits</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(statement.totals.debit)}
              </span>
            </span>
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
              <span className="text-xs font-medium text-muted-foreground">Credits</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(statement.totals.credit)}
              </span>
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
