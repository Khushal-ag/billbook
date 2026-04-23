"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/core/utils";
import { formatISODateDisplay } from "@/lib/core/date";
import type {
  ReceivablesAgingBucket,
  ReceivablesAgingData,
  ReceivablesAgingLine,
} from "@/types/report";
import { reportInvoiceAging } from "@/lib/reports/report-labels";
import {
  ReportRegisterEmptyRow,
  ReportRegisterResultBar,
  ReportRegisterTableScroll,
  rr,
} from "@/components/reports/report-register-ui";
import Link from "next/link";

const ReceivablesAgingBarChart = dynamic(
  () =>
    import("@/components/reports/ReceivablesAgingBarChart").then((m) => ({
      default: m.ReceivablesAgingBarChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[220px] w-full rounded-lg" />,
  },
);

const BUCKET_LABEL: Record<ReceivablesAgingBucket, string> = {
  CURRENT: "Current",
  DAYS_1_30: "1–30 days",
  DAYS_31_60: "31–60 days",
  DAYS_61_90: "61–90 days",
  DAYS_91_PLUS: "91+ days",
};

const BUCKET_CHIPS: { id: ReceivablesAgingBucket | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "CURRENT", label: "Current" },
  { id: "DAYS_1_30", label: "1–30" },
  { id: "DAYS_31_60", label: "31–60" },
  { id: "DAYS_61_90", label: "61–90" },
  { id: "DAYS_91_PLUS", label: "91+" },
];

function moneyToNumber(s: string): number {
  const n = parseFloat(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function ReceivablesAgingSection({ data }: { data: ReceivablesAgingData }) {
  const [bucketFilter, setBucketFilter] = useState<ReceivablesAgingBucket | "ALL">("ALL");

  const chartRows = useMemo(
    () => [
      {
        name: "Current",
        amount: moneyToNumber(data.summary.current),
      },
      {
        name: "1–30",
        amount: moneyToNumber(data.summary.days1to30),
      },
      {
        name: "31–60",
        amount: moneyToNumber(data.summary.days31to60),
      },
      {
        name: "61–90",
        amount: moneyToNumber(data.summary.days61to90),
      },
      {
        name: "91+",
        amount: moneyToNumber(data.summary.days91plus),
      },
    ],
    [data.summary],
  );

  const filteredLines = useMemo(() => {
    if (bucketFilter === "ALL") return data.lines;
    return data.lines.filter((l) => l.agingBucket === bucketFilter);
  }, [data.lines, bucketFilter]);

  const lineCount = data.lines.length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground shadow-sm">
        As of <span className="font-medium text-foreground">{formatISODateDisplay(data.asOf)}</span>
        {" · "}
        {reportInvoiceAging.asOfLineOutstandingPrefix}{" "}
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(data.summary.totalDue)}
        </span>
      </div>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{reportInvoiceAging.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ReceivablesAgingBarChart chartRows={chartRows} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        {BUCKET_CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setBucketFilter(c.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              bucketFilter === c.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ReportRegisterTableScroll>
        <ReportRegisterResultBar
          count={filteredLines.length}
          rowLabel={bucketFilter === "ALL" ? "open invoice lines loaded" : "rows in this age band"}
          limit={bucketFilter === "ALL" && lineCount >= data.limit ? data.limit : undefined}
        />
        <table className={cn(rr.table, "min-w-[960px]")}>
          <thead className={rr.thead}>
            <tr>
              <th className={rr.th}>Invoice</th>
              <th className={rr.th}>Party</th>
              <th className={rr.th}>{reportInvoiceAging.tableColumnAge}</th>
              <th className={rr.thRight}>{reportInvoiceAging.tableColumnOutstanding}</th>
              <th className={rr.thRight}>Days past due</th>
              <th className={rr.th}>Due date</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.length === 0 ? (
              <ReportRegisterEmptyRow colSpan={6} message={reportInvoiceAging.emptyBucket} />
            ) : (
              filteredLines.map((line, idx) => (
                <AgingRow key={`${line.invoiceId}-${idx}`} line={line} />
              ))
            )}
          </tbody>
        </table>
      </ReportRegisterTableScroll>
    </div>
  );
}

function AgingRow({ line }: { line: ReceivablesAgingLine }) {
  return (
    <tr className={rr.tr}>
      <td className={rr.td}>
        <Link href={`/invoices/${line.invoiceId}`} className={rr.link}>
          {line.invoiceNumber}
        </Link>
        <span className="ml-2 text-xs text-muted-foreground">{line.invoiceType}</span>
      </td>
      <td className={rr.td}>{line.partyName}</td>
      <td className={rr.td}>
        <Badge variant="outline" className="font-normal">
          {BUCKET_LABEL[line.agingBucket]}
        </Badge>
      </td>
      <td className={cn(rr.tdRight, "font-medium")}>{formatCurrency(line.dueAmount)}</td>
      <td className={rr.tdRightMuted}>{line.daysPastDue}</td>
      <td className={rr.tdMuted}>
        {line.dueDate ? formatDate(line.dueDate) : formatDate(line.invoiceDate)}
      </td>
    </tr>
  );
}
