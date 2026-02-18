import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";
import { TaxItemizedTable, TaxSummaryTable } from "@/components/tax/TaxSections";
import { useGSTSummary, useGSTItemized, useGSTExport } from "@/hooks/use-tax";
import { useDateRange } from "@/hooks/use-date-range";
import { generateGSTReportHTML, downloadHTML } from "@/lib/utils";

export default function Tax() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useDateRange();

  const [exportRequested, setExportRequested] = useState(false);

  const { data: gstSummary, isPending: summaryPending } = useGSTSummary(
    validStartDate,
    validEndDate,
  );
  const { data: gstItemized, isPending: itemizedPending } = useGSTItemized(
    validStartDate,
    validEndDate,
  );
  const { data: exportData, isFetching: exportFetching } = useGSTExport(
    validStartDate,
    validEndDate,
    exportRequested,
  );

  // Handle export download when data arrives
  useEffect(() => {
    if (exportData && exportRequested) {
      const htmlContent = generateGSTReportHTML(exportData);
      downloadHTML(htmlContent, `gst-report-${startDate}-${endDate}.html`);
      setExportRequested(false);
    }
  }, [exportData, exportRequested, startDate, endDate]);

  const handleExport = () => {
    if (!validStartDate || !validEndDate) return;
    setExportRequested(true);
  };

  const monthlyRows = gstSummary?.monthlyBreakdown ?? [];
  const parseAmount = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;
    const cleaned = value.replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const formatINRAmount = (n: number): string =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalTaxAllMonths = monthlyRows.reduce((sum, r) => sum + parseAmount(r.totalTax), 0);
  const totalAmountAllMonths = monthlyRows.reduce((sum, r) => sum + parseAmount(r.totalAmount), 0);
  const invoiceCountAllMonths = monthlyRows.reduce((sum, r) => sum + (r.invoiceCount ?? 0), 0);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="GST / Tax"
        description="Tax summaries and itemized reports"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!validStartDate || !validEndDate || exportFetching}
          >
            {exportFetching ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            Export for Filing
          </Button>
        }
      />

      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          error={dateRangeError}
        />
      </div>

      <Tabs defaultValue="summary" className="mt-6">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          <TabsTrigger value="itemized">Itemized</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {summaryPending ? (
            <ReportTabSkeleton height="h-60" />
          ) : gstSummary && (gstSummary.monthlyBreakdown ?? []).length > 0 ? (
            <TaxSummaryTable
              rows={gstSummary.monthlyBreakdown ?? []}
              totalCgst={gstSummary.totalCgst ?? "0"}
              totalSgst={gstSummary.totalSgst ?? "0"}
              totalIgst={gstSummary.totalIgst ?? "0"}
              totalTax={formatINRAmount(totalTaxAllMonths)}
              totalAmount={formatINRAmount(totalAmountAllMonths)}
              invoiceCount={invoiceCountAllMonths}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No GST data for this period.
            </p>
          )}
        </TabsContent>

        <TabsContent value="itemized">
          {itemizedPending ? (
            <ReportTabSkeleton height="h-60" />
          ) : gstItemized && (gstItemized.data ?? []).length > 0 ? (
            <TaxItemizedTable rows={gstItemized.data ?? []} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No itemized tax data for this period.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
