import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { StockEntryGrid } from "@/components/items/StockEntryGrid";
import { StockReportTable } from "@/components/items/StockReportTable";
import { useItems, useStockReport, useCreateStockEntry } from "@/hooks/use-items";
import { useParties } from "@/hooks/use-parties";
import type { CreateStockEntryRequest } from "@/types/item";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function Stock() {
  const { data: itemsData, isPending: itemsPending, error: itemsError } = useItems({ limit: 500 });
  const { data: stockReport = [], isPending: reportPending, error: reportError } = useStockReport();
  const { data: partiesData } = useParties();
  const createStockEntry = useCreateStockEntry();

  const items = (itemsData?.items ?? []).filter((i) => !i.deletedAt);
  const suppliers = (partiesData?.parties ?? []).filter(
    (p) => !p.deletedAt && p.type === "SUPPLIER",
  );

  const handleStockSubmit = useCallback(
    async (entries: CreateStockEntryRequest[]) => {
      try {
        for (const entry of entries) {
          await createStockEntry.mutateAsync(entry);
        }
        showSuccessToast(entries.length === 1 ? "Stock entry saved" : "Stock entries saved");
      } catch (err) {
        showErrorToast(err, "Failed to save stock entries");
      }
    },
    [createStockEntry],
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Stock" description="Add stock entries and view stock report" />

      <Tabs defaultValue="add">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="add">Add Stock</TabsTrigger>
          <TabsTrigger value="report">Stock Report</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <p className="mb-4 text-sm text-muted-foreground">
            Add stock entries for STOCK items. Type in the item cell to search and select. Add
            multiple rows to enter several batches at once.
          </p>
          <ErrorBanner error={itemsError} fallbackMessage="Failed to load items" />
          {itemsPending ? (
            <TableSkeleton rows={3} />
          ) : (
            <StockEntryGrid
              items={items}
              suppliers={suppliers}
              onSubmit={handleStockSubmit}
              isSubmitting={createStockEntry.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="report">
          <ErrorBanner error={reportError} fallbackMessage="Failed to load stock report" />
          {reportPending ? <TableSkeleton rows={4} /> : <StockReportTable rows={stockReport} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
