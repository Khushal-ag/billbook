import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportTabSkeleton } from "@/components/skeletons/ReportTabSkeleton";
import DateRangePicker from "@/components/DateRangePicker";
import PageHeader from "@/components/PageHeader";
import {
  useSalesReport,
  usePartyOutstandingReport,
  useProductSalesReport,
  useSalesExport,
} from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { generateSalesReportHTML, downloadHTML, formatDate } from "@/lib/utils";

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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sales Report — ₹{salesData.summary?.totalAmount ?? "0"} total,{" "}
                  {salesData.summary?.totalInvoices ?? 0} invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(salesData.sales ?? []).length > 0 ? (
                  <div className="data-table-container">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6">
                            Invoice
                          </th>
                          <th className="px-3 py-3 text-left font-medium text-muted-foreground">
                            Party
                          </th>
                          <th className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell">
                            Date
                          </th>
                          <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                            Sub Total
                          </th>
                          <th className="hidden px-3 py-3 text-right font-medium text-muted-foreground lg:table-cell">
                            Tax
                          </th>
                          <th className="px-3 py-3 text-right font-medium text-muted-foreground sm:px-6">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(salesData.sales ?? []).map((row) => (
                          <tr
                            key={row.invoiceNumber}
                            className="border-b last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-4 py-3 font-medium text-accent sm:px-6">
                              {row.invoiceNumber}
                            </td>
                            <td className="px-3 py-3">{row.partyName}</td>
                            <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                              {formatDate(row.date)}
                            </td>
                            <td className="hidden px-3 py-3 text-right lg:table-cell">
                              ₹{parseFloat(row.totalAmount) - parseFloat(row.totalTax)}
                            </td>
                            <td className="hidden px-3 py-3 text-right lg:table-cell">
                              ₹{row.totalTax}
                            </td>
                            <td className="px-3 py-3 text-right font-medium sm:px-6">
                              ₹{row.totalAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No sales data for this period.
                  </p>
                )}
              </CardContent>
            </Card>
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
            <div className="data-table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Party</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                      Invoiced
                    </th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">Paid</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                      Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(outstandingData.parties ?? []).map((p) => (
                    <tr key={p.partyId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-3 font-medium">{p.partyName}</td>
                      <td className="px-3 py-3 text-right">₹{p.totalInvoiced}</td>
                      <td className="px-3 py-3 text-right">₹{p.totalPaid}</td>
                      <td className="px-6 py-3 text-right font-medium">₹{p.outstanding}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No outstanding data.</p>
          )}
        </TabsContent>

        <TabsContent value="product-sales">
          {productSalesPending ? (
            <ReportTabSkeleton height="h-60" />
          ) : productSalesData && (productSalesData.products ?? []).length > 0 ? (
            <div className="data-table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                      Qty Sold
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(productSalesData.products ?? []).map((row) => (
                    <tr key={row.productId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-3 font-medium">{row.productName}</td>
                      <td className="px-3 py-3 text-right">{row.totalQuantity}</td>
                      <td className="px-6 py-3 text-right font-medium">₹{row.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
