"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import { ReportBackLink } from "@/components/reports/ReportBackLink";
import { ReportCsvButton } from "@/components/reports/ReportCsvButton";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import { ReportRegisterFilterCard } from "@/components/reports/report-register-ui";
import { ReceivablesAgingSection } from "@/components/reports/ReceivablesAgingSection";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import { useReceivablesAging } from "@/hooks/use-reports";
import { parseISODateString, toISODateString } from "@/lib/date";
import { DEFAULT_REPORT_LIMIT } from "@/constants";
import { reportInvoiceAging } from "@/lib/report-labels";

export default function ReceivablesAgingPage() {
  const [asOf, setAsOf] = useState(() => toISODateString(new Date()));
  const [limit, setLimit] = useState(DEFAULT_REPORT_LIMIT);

  const asOfValid = parseISODateString(asOf) !== undefined;
  const { data, isPending, error } = useReceivablesAging(asOfValid ? asOf : "", limit);

  return (
    <div className="page-container animate-fade-in">
      <ReportBackLink />
      <PageHeader
        title={reportInvoiceAging.title}
        description={reportInvoiceAging.description}
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
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-of" className="text-sm text-muted-foreground">
              As of date
            </Label>
            <Input
              id="as-of"
              type="date"
              className="w-full sm:w-44"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
          <ReportLimitInput value={limit} onChange={setLimit} />
        </div>
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
