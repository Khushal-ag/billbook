import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import {
  buildAuditHighlightParams,
  getAuditActivityTitle,
  getAuditChangeHighlights,
  resolveInvoiceAuditDisplayContext,
} from "@/lib/audit-log";
import { formatDate, formatTime } from "@/lib/utils";
import type { AuditLog } from "@/types/audit-log";

interface InvoiceAuditHistoryProps {
  logs: AuditLog[];
}

/** Collapse consecutive UPDATE events on the same day into one entry. */
function deduplicateLogs(logs: AuditLog[]): Array<AuditLog & { collapsedCount?: number }> {
  const result: Array<AuditLog & { collapsedCount?: number }> = [];

  for (const log of logs) {
    const last = result[result.length - 1];
    const sameDay =
      last &&
      last.action === "UPDATE" &&
      log.action === "UPDATE" &&
      last.resourceType === log.resourceType &&
      formatDate(last.createdAt) === formatDate(log.createdAt);

    if (sameDay) {
      last.collapsedCount = (last.collapsedCount ?? 1) + 1;
    } else {
      result.push({ ...log });
    }
  }

  return result;
}

export function InvoiceAuditHistory({ logs }: InvoiceAuditHistoryProps) {
  const isSimpleMode = useIsSimpleMode();

  if (isSimpleMode) return null;
  if (!logs.length) return null;

  const entries = deduplicateLogs(logs);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="h-4 w-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ol className="space-y-0 divide-y divide-border">
          {entries.map((log) => {
            const invoiceCtx = resolveInvoiceAuditDisplayContext(logs, log);
            const title = getAuditActivityTitle(log, invoiceCtx);
            const highlight = log.collapsedCount
              ? ""
              : getAuditChangeHighlights(log.changes, buildAuditHighlightParams(log, invoiceCtx));
            const date = formatDate(log.createdAt);
            const timeRaw = formatTime(log.createdAt);
            const time = timeRaw === "—" ? "" : timeRaw;

            return (
              <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm leading-snug text-foreground">{title}</p>

                  {log.collapsedCount && log.collapsedCount > 1 && (
                    <p className="text-xs text-muted-foreground">
                      +{log.collapsedCount - 1} more edit{log.collapsedCount - 1 !== 1 ? "s" : ""}{" "}
                      on this day
                    </p>
                  )}

                  {!log.collapsedCount && highlight && (
                    <p className="text-xs text-muted-foreground">{highlight}</p>
                  )}

                  <p className="text-xs text-muted-foreground/70">
                    {date}
                    {time && <span className="ml-1">{time}</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
