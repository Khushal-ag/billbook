import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import TableSkeleton from "@/components/TableSkeleton";
import { useAuditLogs } from "@/hooks/use-audit-logs";

const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "FINALIZE",
  "CANCEL",
] as const;

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const pageSize = 20;

  const { data, isLoading, error } = useAuditLogs({
    page,
    pageSize,
    action: actionFilter || undefined,
  });

  const logs = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Audit Logs"
        description="Track all actions performed in your business"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No audit logs found.
        </p>
      ) : (
        <>
          <div className="data-table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">
                    Action
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Resource
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Resource ID
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    User
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Role
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-6 py-3">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="text-xs">
                        {log.resourceType}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-accent font-medium">
                      #{log.resourceId}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {log.userName}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={
                          log.userRole === "OWNER" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {log.userRole}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">
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
