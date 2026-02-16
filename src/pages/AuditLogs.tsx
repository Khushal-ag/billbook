import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { formatDate } from "@/lib/utils";

const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "FINALIZE", "CANCEL"] as const;

function getActionBadgeVariant(
  action: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "CREATE":
      return "default";
    case "UPDATE":
      return "secondary";
    case "DELETE":
      return "destructive";
    case "FINALIZE":
      return "default";
    case "CANCEL":
      return "destructive";
    default:
      return "outline";
  }
}

function getChangesDisplay(changes: Record<string, unknown> | null): string {
  if (!changes) return "—";

  // Handle nested changes object
  const actualChanges =
    typeof changes === "object" &&
    changes !== null &&
    "changes" in changes &&
    typeof (changes as Record<string, unknown>).changes === "object"
      ? ((changes as Record<string, unknown>).changes as Record<string, unknown>)
      : changes;

  const entries = Object.entries(actualChanges);
  if (entries.length === 0) return "—";

  // Show key: value pairs for first 2 items
  return (
    entries
      .slice(0, 2)
      .map(([k, v]) => {
        const displayValue = typeof v === "string" && v.length > 20 ? v.slice(0, 20) + "..." : v;
        return `${k}: ${displayValue}`;
      })
      .join(" • ") + (entries.length > 2 ? ` • +${entries.length - 2} more` : "")
  );
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const pageSize = 20;

  const { data, isPending, error } = useAuditLogs({
    page,
    pageSize,
    action: actionFilter || undefined,
  });

  const logs = data?.logs ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / pageSize) || 1;
  const total = data?.count ?? 0;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Audit Logs" description="Track all actions performed in your business" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select
          value={actionFilter}
          onValueChange={(v) => {
            setActionFilter(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load audit logs" />

      {isPending ? (
        <TableSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No audit logs found.</p>
      ) : (
        <>
          <div className="data-table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Changes</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Role</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {" "}
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={getActionBadgeVariant(log.action)}
                        className="font-mono text-xs"
                      >
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
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {getChangesDisplay(log.changes)}
                    </td>
                    <td className="px-3 py-3">
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

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
