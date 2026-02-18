import { Download, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/DateRangePicker";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { StatementJsonData, StatementPdfData } from "@/lib/party-ledger";

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
            <RefreshCcw className="mr-2 h-4 w-4" /> Load Statement
          </Button>
          <Button type="button" onClick={onGeneratePdf} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {isFetching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading statement...
        </div>
      )}

      {statement && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Opening:</span>{" "}
              {formatCurrency(statement.openingBalance)}
            </div>
            <div>
              <span className="text-muted-foreground">Closing:</span>{" "}
              {formatCurrency(statement.closingBalance)}
            </div>
            <div>
              <span className="text-muted-foreground">Debit:</span>{" "}
              {formatCurrency(statement.totals.debit)}
            </div>
            <div>
              <span className="text-muted-foreground">Credit:</span>{" "}
              {formatCurrency(statement.totals.credit)}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Debit</th>
                  <th className="px-3 py-2 text-right font-medium">Credit</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {statement.entries.map((entry, idx) => (
                  <tr key={`${entry.entryType}-${idx}`} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(entry.entryDate)}
                    </td>
                    <td className="px-3 py-2">{entry.entryType}</td>
                    <td className="px-3 py-2 text-right">
                      {entry.debitAmount ? formatCurrency(entry.debitAmount) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {entry.creditAmount ? formatCurrency(entry.creditAmount) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    Download PDF
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
