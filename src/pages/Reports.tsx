import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import DateRangePicker from "@/components/DateRangePicker";
import PageHeader from "@/components/PageHeader";
import {
  OutstandingReportTable,
  ProductSalesTable,
  SalesReportCard,
} from "@/components/reports/ReportSections";
import {
  useSalesReport,
  usePartyOutstandingReport,
  useProductSalesReport,
  useSalesExport,
} from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { generateSalesReportHTML, downloadHTML } from "@/lib/utils";

export default function Reports() {
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

  const { data: salesData, isPending: salesPending } = useSalesReport(validStartDate, validEndDate);
  const { data: outstandingData, isPending: outstandingPending } = usePartyOutstandingReport();
  const { data: productSalesData, isPending: productSalesPending } = useProductSalesReport(
    validStartDate,
    validEndDate,
  );
  const { data: exportData, isFetching: exportFetching } = useSalesExport(
    validStartDate,
    validEndDate,
    exportRequested,
  );

  // Handle export download when data arrives
  useEffect(() => {
    if (exportData && exportRequested) {
      const htmlContent = generateSalesReportHTML(exportData);
      downloadHTML(htmlContent, `sales-report-${startDate}-${endDate}.html`);
      setExportRequested(false);
    }
  }, [exportData, exportRequested, startDate, endDate]);

  const handleExport = () => {
    if (!validStartDate || !validEndDate) return;
    setExportRequested(true);
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Reports"
        description="Sales, outstanding, and product reports"
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
            Export
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

      <Tabs defaultValue="sales">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="outstanding">Party Outstanding</TabsTrigger>
          <TabsTrigger value="product-sales">Product Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          {salesPending ? (
            <ReportTabSkeleton height="h-80" />
          ) : salesData ? (
            <SalesReportCard summary={salesData.summary} rows={salesData.sales ?? []} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select a valid date range to view sales data.
            </p>
          )}
        </TabsContent>

        <TabsContent value="outstanding">
          {outstandingPending ? (
            <ReportTabSkeleton height="h-60" />
          ) : outstandingData && (outstandingData.parties ?? []).length > 0 ? (
            <OutstandingReportTable rows={outstandingData.parties ?? []} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No outstanding data.</p>
          )}
        </TabsContent>

        <TabsContent value="product-sales">
          {productSalesPending ? (
            <ReportTabSkeleton height="h-60" />
          ) : productSalesData && (productSalesData.products ?? []).length > 0 ? (
            <ProductSalesTable rows={productSalesData.products ?? []} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No product sales data for this period.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
