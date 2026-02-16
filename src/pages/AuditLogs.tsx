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

const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "FINALIZE", "CANCEL"] as const;

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
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    Resource ID
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-3">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="text-xs">
                        {log.resourceType}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-medium text-accent">
                      {log.resourceId != null ? `#${log.resourceId}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {log.actorUserId != null ? `User #${log.actorUserId}` : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={log.actorRole === "OWNER" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {log.actorRole ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
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
