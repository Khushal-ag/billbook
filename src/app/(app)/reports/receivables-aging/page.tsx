"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportRegisterExportToolbar } from "@/components/reports/ReportRegisterExportToolbar";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import {
  ReportRegisterFilterCard,
  ReportRegisterFilterGrid,
  ReportRegisterFilterGroup,
} from "@/components/reports/report-register-ui";
import {
  ReceivablesAgingSection,
  receivablesAgingBucketDisplay,
} from "@/components/reports/ReceivablesAgingSection";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { useReceivablesAging } from "@/hooks/use-reports";
import { formatISODateDisplay, parseISODateString, toISODateString } from "@/lib/core/date";
import { formatCurrency, formatDate } from "@/lib/core/utils";
import type { ClientReportTableExport } from "@/lib/reports/report-table-export";
import { DEFAULT_REPORT_LIMIT } from "@/constants";
import { reportInvoiceAging } from "@/lib/reports/report-labels";
import type { ReceivablesAgingBucket } from "@/types/report";

export default function ReceivablesAgingPage() {
  const [asOf, setAsOf] = useState(() => toISODateString(new Date()));
  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);
  const [bucketFilter, setBucketFilter] = useState<ReceivablesAgingBucket | "ALL">("ALL");

  const asOfValid = parseISODateString(asOf) !== undefined;
  const { data, isPending, error } = useReceivablesAging(asOfValid ? asOf : "", limit);

  const clientTableExport = useMemo((): ClientReportTableExport | null => {
    if (!data) return null;
    const lines =
      bucketFilter === "ALL"
        ? data.lines
        : data.lines.filter((l) => l.agingBucket === bucketFilter);
    const subtitleParts = [`As of ${formatISODateDisplay(data.asOf)}`];
    if (bucketFilter !== "ALL") {
      subtitleParts.push(`Age: ${receivablesAgingBucketDisplay[bucketFilter]}`);
    }
    return {
      reportTitle: reportInvoiceAging.title,
      subtitle: subtitleParts.join(" · "),
      headers: [
        "Invoice",
        "Type",
        "Party",
        reportInvoiceAging.tableColumnAge,
        reportInvoiceAging.tableColumnOutstanding,
        "Days past due",
        "Due date",
      ],
      rows: lines.map((line) => [
        line.invoiceNumber,
        line.invoiceType,
        line.partyName,
        receivablesAgingBucketDisplay[line.agingBucket],
        formatCurrency(line.dueAmount),
        String(line.daysPastDue),
        line.dueDate ? formatDate(line.dueDate) : formatDate(line.invoiceDate),
      ]),
    };
  }, [data, bucketFilter]);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportInvoiceAging.title}
        description={reportInvoiceAging.description}
        backHref="/reports"
        backLabel="Back to reports"
      />

      <ErrorBanner error={error} fallbackMessage={reportInvoiceAging.loadError} />

      <ReportRegisterFilterCard>
        <ReportRegisterFilterGrid cols={2} className="xl:grid-cols-[auto_auto]">
          <ReportRegisterFilterGroup title="Period">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="as-of" className="text-xs font-medium text-muted-foreground">
                As of date
              </Label>
              <Input
                id="as-of"
                type="date"
                className="h-9 w-full sm:w-44"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
              />
            </div>
          </ReportRegisterFilterGroup>
          <ReportRegisterFilterGroup>
            <ReportLimitInput value={limit} onChange={setLimit} stacked />
          </ReportRegisterFilterGroup>
        </ReportRegisterFilterGrid>
      </ReportRegisterFilterCard>

      {isPending ? (
        <ReportTabSkeleton layout="aging" />
      ) : data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <ReportRegisterExportToolbar
              reportPath="/reports/receivables-aging"
              query={{ asOf, limit }}
              csvFilename={reportInvoiceAging.csvFilename}
              pdfFilename={reportInvoiceAging.pdfFilename}
              xlsxFilename={reportInvoiceAging.xlsxFilename}
              clientTableExport={clientTableExport}
              disabled={!asOfValid}
            />
          </div>
          <ReceivablesAgingSection
            data={data}
            bucketFilter={bucketFilter}
            onBucketFilterChange={setBucketFilter}
          />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Enter a valid as-of date.
        </p>
      )}
    </div>
  );
}
