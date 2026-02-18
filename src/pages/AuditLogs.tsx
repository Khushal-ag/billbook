import { useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { AuditLogFilters, AuditLogsTable } from "@/components/audit-logs/AuditLogSections";
import { useAuditLogs } from "@/hooks/use-audit-logs";

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

      <AuditLogFilters
        actionFilter={actionFilter}
        onActionFilterChange={(v) => {
          setActionFilter(v === "ALL" ? "" : v);
          setPage(1);
        }}
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load audit logs" />

      {isPending ? (
        <TableSkeleton rows={5} />
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No audit logs found.</p>
      ) : (
        <>
          <AuditLogsTable logs={logs} />

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
