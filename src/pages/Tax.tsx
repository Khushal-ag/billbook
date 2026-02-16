import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";
import { useGSTSummary, useGSTItemized, useGSTExport } from "@/hooks/use-tax";
import { useDateRange } from "@/hooks/use-date-range";
import { generateGSTReportHTML, downloadHTML, formatMonthYear, formatDate } from "@/lib/utils";

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
            <>
              <div className="data-table-container">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">
                        Month
                      </th>
                      <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell">
                        CGST
                      </th>
                      <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell">
                        SGST
                      </th>
                      <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell">
                        IGST
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        Total Tax
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        Total Amount
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-6">
                        Invoices
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(gstSummary.monthlyBreakdown ?? []).map((row) => (
                      <tr key={row.month} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium sm:px-6">
                          {formatMonthYear(row.month)}
                        </td>
                        <td className="hidden px-3 py-3 text-right md:table-cell">₹{row.cgst}</td>
                        <td className="hidden px-3 py-3 text-right md:table-cell">₹{row.sgst}</td>
                        <td className="hidden px-3 py-3 text-right md:table-cell">₹{row.igst}</td>
                        <td className="px-3 py-3 text-right font-medium">₹{row.totalTax}</td>
                        <td className="px-3 py-3 text-right">₹{row.totalAmount}</td>
                        <td className="px-3 py-3 text-right sm:px-6">{row.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-medium">
                      <td className="px-4 py-3 sm:px-6">Total</td>
                      <td className="hidden px-3 py-3 text-right md:table-cell">
                        ₹{gstSummary.totalCgst ?? "0"}
                      </td>
                      <td className="hidden px-3 py-3 text-right md:table-cell">
                        ₹{gstSummary.totalSgst ?? "0"}
                      </td>
                      <td className="hidden px-3 py-3 text-right md:table-cell">
                        ₹{gstSummary.totalIgst ?? "0"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        ₹{formatINRAmount(totalTaxAllMonths)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        ₹{formatINRAmount(totalAmountAllMonths)}
                      </td>
                      <td className="px-3 py-3 text-right sm:px-6">{invoiceCountAllMonths}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
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
            <div className="data-table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">
                      Invoice
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Party</th>
                    <th className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell">
                      Date
                    </th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                      Taxable
                    </th>
                    <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                      CGST
                    </th>
                    <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                      SGST
                    </th>
                    <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                      IGST
                    </th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-6">
                      Total Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(gstItemized.data ?? []).map((row) => (
                    <tr key={row.invoiceId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium text-accent sm:px-6">
                        {row.invoiceNumber}
                      </td>
                      <td className="px-3 py-3">{row.partyName}</td>
                      <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                        {formatDate(row.invoiceDate)}
                      </td>
                      <td className="px-3 py-3 text-right">₹{row.taxableAmount}</td>
                      <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.cgst}</td>
                      <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.sgst}</td>
                      <td className="hidden px-3 py-3 text-right lg:table-cell">₹{row.igst}</td>
                      <td className="px-3 py-3 text-right font-medium sm:px-6">₹{row.totalTax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
