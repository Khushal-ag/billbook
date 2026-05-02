"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateCompact } from "@/lib/core/utils";
import type { DashboardData, DashboardRecentLedgerRow } from "@/types/dashboard";
import {
  buildRecentActivityRows,
  filterActivityRows,
  ledgerTypeLabel,
  type ActivityTabFilter,
} from "@/lib/business/dashboard-home";

const PAGE_SIZE = 8;

interface DashboardHomeLedgerTableProps {
  dashboard: DashboardData;
}

const ACTIVITY_TABS: { value: ActivityTabFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sales", label: "Sales" },
  { value: "purchases", label: "Purchases" },
  { value: "payments", label: "Payments" },
];

export function DashboardHomeLedgerTable({ dashboard }: DashboardHomeLedgerTableProps) {
  const allRows = useMemo(() => buildRecentActivityRows(dashboard), [dashboard]);
  const [tab, setTab] = useState<ActivityTabFilter>("all");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => filterActivityRows(allRows, tab), [allRows, tab]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [tab, totalPages]);

  const onTabChange = (value: string) => {
    setTab(value as ActivityTabFilter);
    setPage(1);
  };

  return (
    <section>
      <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Latest movements. Use the tabs to filter by type.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={tab} onValueChange={onTabChange} className="w-full">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted/50 p-1 sm:w-auto">
              {ACTIVITY_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={tab} className="mt-5 outline-none focus-visible:ring-offset-0">
              <PaginatedActivityTable
                rows={filteredRows}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

function PaginatedActivityTable({
  rows,
  page,
  setPage,
  totalPages,
}: {
  rows: DashboardRecentLedgerRow[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}) {
  const total = rows.length;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);
  const end = start + pageRows.length;

  return (
    <div className="rounded-xl border border-border/70 bg-background/80">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm" aria-label="Recent activity">
          <thead className="sticky top-0 z-[1] bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Party
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mode
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length > 0 ? (
              pageRows.map((row, idx) => {
                const key = row.id != null ? String(row.id) : `${row.occurredAt}-${start + idx}`;
                return (
                  <tr
                    key={key}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                      {formatDateCompact(row.occurredAt)}
                    </td>
                    <td className="px-4 py-3 font-medium">{ledgerTypeLabel(row.entryType)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3">{row.partyName}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {row.mode?.trim() ? row.mode : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No rows for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <div className="flex flex-col gap-3 border-t border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <p className="text-xs tabular-nums text-muted-foreground">
            {totalPages > 1
              ? `Showing ${start + 1}–${end} of ${total}`
              : `${total} ${total === 1 ? "row" : "rows"}`}
          </p>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
