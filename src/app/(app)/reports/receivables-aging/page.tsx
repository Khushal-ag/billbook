"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import {
  ReportRegisterFilterCard,
  ReportRegisterFilterGrid,
  ReportRegisterFilterGroup,
} from "@/components/reports/report-register-ui";
import { ReceivablesAgingSection } from "@/components/reports/ReceivablesAgingSection";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { useReceivablesAging } from "@/hooks/use-reports";
import { parseISODateString, toISODateString } from "@/lib/core/date";
import { DEFAULT_REPORT_LIMIT } from "@/constants";
import { reportInvoiceAging } from "@/lib/reports/report-labels";

export default function ReceivablesAgingPage() {
  const [asOf, setAsOf] = useState(() => toISODateString(new Date()));
  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);

  const asOfValid = parseISODateString(asOf) !== undefined;
  const { data, isPending, error } = useReceivablesAging(asOfValid ? asOf : "", limit);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportInvoiceAging.title}
        description={reportInvoiceAging.description}
        backHref="/reports"
        backLabel="Back to reports"
        action={
          <ReportCsvButton
            reportPath="/reports/receivables-aging"
            query={{ asOf, limit }}
            filename={reportInvoiceAging.csvFilename}
            disabled={!asOfValid}
          />
        }
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
        <ReceivablesAgingSection data={data} />
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Enter a valid as-of date.
        </p>
      )}
    </div>
  );
}
