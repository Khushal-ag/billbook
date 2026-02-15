import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import DateRangePicker from "@/components/DateRangePicker";
import { useGSTSummary, useGSTItemized } from "@/hooks/use-tax";
import { useDateRange } from "@/hooks/use-date-range";
import { downloadJSON } from "@/lib/utils";

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

  const { data: gstSummary, isLoading: summaryLoading } = useGSTSummary(
    validStartDate,
    validEndDate,
  );
  const { data: gstItemized, isLoading: itemizedLoading } = useGSTItemized(
    validStartDate,
    validEndDate,
  );

  const handleExport = () => {
    const exportData = gstSummary || gstItemized;
    if (!exportData) return;
    downloadJSON(exportData, `gst-report-${startDate}-${endDate}.json`);
  };

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
            disabled={!gstSummary}
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Export for Filing
          </Button>
        }
      />

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        error={dateRangeError}
      />

      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          <TabsTrigger value="itemized">Itemized</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {summaryLoading ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : gstSummary && gstSummary.monthlyBreakdown.length > 0 ? (
            <>
              <div className="data-table-container">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left font-medium text-muted-foreground px-6 py-3">
                        Month
                      </th>
                      <th className="text-right font-medium text-muted-foreground px-3 py-3">
                        CGST
                      </th>
                      <th className="text-right font-medium text-muted-foreground px-3 py-3">
                        SGST
                      </th>
                      <th className="text-right font-medium text-muted-foreground px-3 py-3">
                        IGST
                      </th>
                      <th className="text-right font-medium text-muted-foreground px-3 py-3">
                        Total Tax
                      </th>
                      <th className="text-right font-medium text-muted-foreground px-3 py-3">
                        Total Amount
                      </th>
                      <th className="text-right font-medium text-muted-foreground px-6 py-3">
                        Invoices
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstSummary.monthlyBreakdown.map((row) => (
                      <tr
                        key={row.month}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-6 py-3 font-medium">{row.month}</td>
                        <td className="px-3 py-3 text-right">₹{row.cgst}</td>
                        <td className="px-3 py-3 text-right">₹{row.sgst}</td>
                        <td className="px-3 py-3 text-right">₹{row.igst}</td>
                        <td className="px-3 py-3 text-right font-medium">
                          ₹{row.totalTax}
                        </td>
                        <td className="px-3 py-3 text-right">
                          ₹{row.totalAmount}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {row.invoiceCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-medium">
                      <td className="px-6 py-3">Total</td>
                      <td className="px-3 py-3 text-right">
                        ₹{gstSummary.totalCgst}
                      </td>
                      <td className="px-3 py-3 text-right">
                        ₹{gstSummary.totalSgst}
                      </td>
                      <td className="px-3 py-3 text-right">
                        ₹{gstSummary.totalIgst}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No GST data for this period.
            </p>
          )}
        </TabsContent>

        <TabsContent value="itemized">
          {itemizedLoading ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : gstItemized && gstItemized.data.length > 0 ? (
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
                      Taxable
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-3">
                      CGST
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-3">
                      SGST
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-3 py-3">
                      IGST
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-3">
                      Total Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gstItemized.data.map((row) => (
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
                        ₹{row.taxableAmount}
                      </td>
                      <td className="px-3 py-3 text-right">₹{row.cgst}</td>
                      <td className="px-3 py-3 text-right">₹{row.sgst}</td>
                      <td className="px-3 py-3 text-right">₹{row.igst}</td>
                      <td className="px-6 py-3 text-right font-medium">
                        ₹{row.totalTax}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No itemized tax data for this period.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
