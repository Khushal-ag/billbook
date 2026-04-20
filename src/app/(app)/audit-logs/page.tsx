"use client";

import { useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { AuditLogFilters, AuditLogsTable } from "@/components/audit-logs/AuditLogSections";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { usePagination } from "@/hooks/use-pagination";

export default function AuditLogs() {
  const { page, setPage, resetPage } = usePagination();
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
      <PageHeader
        title="Audit logs"
        description="Track actions in this business. Switch to Team & roles or business settings from the sidebar when needed."
      />

      <AuditLogFilters
        actionFilter={actionFilter}
        onActionFilterChange={(v) => {
          setActionFilter(v === "ALL" ? "" : v);
          resetPage();
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
