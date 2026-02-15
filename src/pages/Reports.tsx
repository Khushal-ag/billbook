import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import DateRangePicker from "@/components/DateRangePicker";
import {
  useSalesReport,
  usePartyOutstandingReport,
  useProductSalesReport,
} from "@/hooks/use-reports";
import { useDateRange } from "@/hooks/use-date-range";
import { downloadJSON } from "@/lib/utils";

export default function Reports() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    isValid,
    validStartDate,
    validEndDate,
  } = useDateRange();

  const { data: salesData, isLoading: salesLoading } = useSalesReport(
    validStartDate,
    validEndDate,
  );
  const { data: outstandingData, isLoading: outstandingLoading } =
    usePartyOutstandingReport();
  const { data: productSalesData, isLoading: productSalesLoading } =
    useProductSalesReport(validStartDate, validEndDate);

  const handleExport = () => {
    if (!salesData) return;
    downloadJSON(salesData, `sales-report-${startDate}-${endDate}.json`);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-description">
          Sales, outstanding, and product reports
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          error={dateRangeError}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!salesData}
        >
          <Download className="h-3.5 w-3.5 mr-2" />
          Export JSON
        </Button>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="outstanding">Party Outstanding</TabsTrigger>
          <TabsTrigger value="product-sales">Product Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          {salesLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : salesData ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sales Report — ₹{salesData.totalAmount} total,{" "}
                  {salesData.invoiceCount} invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesData.data.length > 0 ? (
                  <div className="data-table-container">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left font-medium text-muted-foreground px-6 py-3">
                            Invoice
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-3 py-3">
                            Party
                          </th>
                          <th className="text-left font-medium text-muted-foreground px-3 py-3">
                            Date
                          </th>
                          <th className="text-right font-medium text-muted-foreground px-3 py-3">
                            Sub Total
                          </th>
                          <th className="text-right font-medium text-muted-foreground px-3 py-3">
                            Tax
                          </th>
                          <th className="text-right font-medium text-muted-foreground px-6 py-3">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.data.map((row) => (
                          <tr
                            key={row.invoiceId}
                            className="border-b last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-6 py-3 font-medium text-accent">
                              {row.invoiceNumber}
                            </td>
                            <td className="px-3 py-3">{row.partyName}</td>
                            <td className="px-3 py-3 text-muted-foreground">
                              {row.invoiceDate}
                            </td>
                            <td className="px-3 py-3 text-right">
                              ₹{row.subTotal}
                            </td>
                            <td className="px-3 py-3 text-right">
                              ₹{row.taxAmount}
                            </td>
                            <td className="px-6 py-3 text-right font-medium">
                              ₹{row.totalAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sales data for this period.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a valid date range to view sales data.
            </p>
          )}
        </TabsContent>

        <TabsContent value="outstanding">
          {outstandingLoading ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : outstandingData && outstandingData.data.length > 0 ? (
            <div className="data-table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Party
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-3">
                      Invoiced
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-3">
                      Paid
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-3">
                      Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingData.data.map((p) => (
                    <tr
                      key={p.partyId}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-6 py-3 font-medium">{p.partyName}</td>
                      <td className="px-3 py-3 text-right">
                        ₹{p.totalInvoiced}
                      </td>
                      <td className="px-3 py-3 text-right">₹{p.totalPaid}</td>
                      <td className="px-6 py-3 text-right font-medium">
                        ₹{p.outstanding}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No outstanding data.
            </p>
          )}
        </TabsContent>

        <TabsContent value="product-sales">
          {productSalesLoading ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : productSalesData && productSalesData.data.length > 0 ? (
            <div className="data-table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Product
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-3">
                      Qty Sold
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-3">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productSalesData.data.map((row) => (
                    <tr
                      key={row.productId}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-6 py-3 font-medium">
                        {row.productName}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {row.quantitySold}
                      </td>
                      <td className="px-6 py-3 text-right font-medium">
                        ₹{row.totalAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No product sales data for this period.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
