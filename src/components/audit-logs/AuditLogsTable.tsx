import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import {
  getActionBadgeVariant,
  getAuditActivityTitle,
  getAuditChangeHighlights,
  getAuditMeta,
  getAuditResourceTypeLabel,
} from "@/lib/audit-log";
import { ACTION_DOT_COLORS } from "@/constants/audit";
import type { AuditLog } from "@/types/audit-log";

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const getDotColor = (action: string) => ACTION_DOT_COLORS[action] ?? "bg-slate-400";

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between border-b pb-3 sm:mb-4 sm:pb-4">
        <p className="text-sm font-semibold text-foreground">Activity Timeline</p>
        <p className="text-xs text-muted-foreground">Latest first</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {logs.map((log, index) => {
          const hasConnector = index < logs.length - 1;
          const activityTitle = getAuditActivityTitle(log);
          const activityMeta = getAuditMeta(log);
          const highlights = getAuditChangeHighlights(log.changes);

          return (
            <article key={log.id} className="relative">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative mt-1 flex w-4 shrink-0 justify-center">
                  <span
                    className={`relative z-10 h-3 w-3 rounded-full ring-2 ring-background ${getDotColor(log.action)}`}
                  />
                  {hasConnector && (
                    <span className="absolute top-3 h-[calc(100%+1rem)] w-px bg-border/80 sm:h-[calc(100%+1.25rem)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1 rounded-md border border-border/60 bg-background/70 p-3 transition-colors hover:bg-muted/30 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold leading-5 text-foreground">
                      {activityTitle}
                    </p>
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px]">
                      {log.action}
                    </Badge>
                  </div>

                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                  </p>

                  {highlights ? (
                    <p className="mt-2 text-xs text-muted-foreground">{highlights}</p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">{activityMeta}</p>
                  )}

                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {getAuditResourceTypeLabel(log.resourceType)}
                    </Badge>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
