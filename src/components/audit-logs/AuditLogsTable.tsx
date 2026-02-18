import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getActionBadgeVariant, getChangesDisplay } from "@/lib/audit-log";
import type { AuditLog } from "@/types/audit-log";

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">
              Timestamp
            </th>
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Action</th>
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">Resource</th>
            <th className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell">
              Changes
            </th>
            <th className="hidden px-3 py-3 text-left font-medium text-muted-foreground lg:table-cell">
              Role
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground sm:px-6">
                {formatDate(log.createdAt)}
              </td>
              <td className="px-3 py-3">
                <Badge variant={getActionBadgeVariant(log.action)} className="font-mono text-xs">
                  {log.action}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <Badge variant="outline" className="text-xs">
                  {log.resourceType}
                </Badge>
                {log.resourceId != null && (
                  <span className="ml-2 font-medium text-accent">#{log.resourceId}</span>
                )}
              </td>
              <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                {getChangesDisplay(log.changes)}
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                <Badge
                  variant={log.actorRole === "OWNER" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {log.actorRole ?? "—"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
