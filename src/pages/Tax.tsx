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
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!gstSummary}>
            <Download className="mr-2 h-3.5 w-3.5" />
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
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Month
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        CGST
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        SGST
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        IGST
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        Total Tax
                      </th>
                      <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                        Invoices
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstSummary.monthlyBreakdown.map((row) => (
                      <tr key={row.month} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-3 font-medium">{row.month}</td>
                        <td className="px-3 py-3 text-right">₹{row.cgst}</td>
                        <td className="px-3 py-3 text-right">₹{row.sgst}</td>
                        <td className="px-3 py-3 text-right">₹{row.igst}</td>
                        <td className="px-3 py-3 text-right font-medium">₹{row.totalTax}</td>
                        <td className="px-3 py-3 text-right">₹{row.totalAmount}</td>
                        <td className="px-6 py-3 text-right">{row.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-medium">
                      <td className="px-6 py-3">Total</td>
                      <td className="px-3 py-3 text-right">₹{gstSummary.totalCgst}</td>
                      <td className="px-3 py-3 text-right">₹{gstSummary.totalSgst}</td>
                      <td className="px-3 py-3 text-right">₹{gstSummary.totalIgst}</td>
                      <td colSpan={3} />
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
          {itemizedLoading ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : gstItemized && gstItemized.data.length > 0 ? (
            <div className="data-table-container">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Party</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                      Taxable
                    </th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">CGST</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">SGST</th>
                    <th className="px-3 py-3 text-right font-medium text-muted-foreground">IGST</th>
                    <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                      Total Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gstItemized.data.map((row) => (
                    <tr key={row.invoiceId} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-3 font-medium text-accent">{row.invoiceNumber}</td>
                      <td className="px-3 py-3">{row.partyName}</td>
                      <td className="px-3 py-3 text-muted-foreground">{row.invoiceDate}</td>
                      <td className="px-3 py-3 text-right">₹{row.taxableAmount}</td>
                      <td className="px-3 py-3 text-right">₹{row.cgst}</td>
                      <td className="px-3 py-3 text-right">₹{row.sgst}</td>
                      <td className="px-3 py-3 text-right">₹{row.igst}</td>
                      <td className="px-6 py-3 text-right font-medium">₹{row.totalTax}</td>
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
