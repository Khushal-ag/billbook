import { useCallback, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { StockOverviewCards } from "@/components/items/StockOverviewCards";
import { StockAlertsBanner } from "@/components/items/StockAlertsBanner";
import { StockEntryGrid } from "@/components/items/StockEntryGrid";
import { StockReportTable } from "@/components/items/StockReportTable";
import { StockEntriesTable } from "@/components/items/StockEntriesTable";
import { StockEntryDetailSheet } from "@/components/items/StockEntryDetailSheet";
import { useItems, useStockList, useStockEntries, useCreateStockEntry } from "@/hooks/use-items";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-alerts";
import { useParties } from "@/hooks/use-parties";
import type { CreateStockEntryRequest, StockEntry } from "@/types/item";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function Stock() {
  const [activeTab, setActiveTab] = useState("overview");
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const { data: itemsData, isPending: itemsPending, error: itemsError } = useItems({ limit: 500 });
  const {
    data: stockData,
    isPending: stockPending,
    error: stockError,
  } = useStockList({ limit: 200 });
  const { data: alertsData } = useAlerts(true);
  const markAlertRead = useMarkAlertRead();
  const {
    data: stockEntriesRaw,
    isPending: entriesPending,
    error: entriesError,
  } = useStockEntries();
  const { data: partiesData } = useParties();
  const createStockEntry = useCreateStockEntry();

  const items = (itemsData?.items ?? []).filter((i) => !i.deletedAt);
  const suppliers = (partiesData?.parties ?? []).filter(
    (p) => !p.deletedAt && p.type === "SUPPLIER",
  );
  const stockEntries = useMemo((): StockEntry[] => {
    if (Array.isArray(stockEntriesRaw)) return stockEntriesRaw;
    if (
      stockEntriesRaw &&
      typeof stockEntriesRaw === "object" &&
      "entries" in stockEntriesRaw &&
      Array.isArray((stockEntriesRaw as { entries?: StockEntry[] }).entries)
    ) {
      return (stockEntriesRaw as { entries: StockEntry[] }).entries;
    }
    return [];
  }, [stockEntriesRaw]);

  const summary = stockData?.summary ?? { totalStockValue: "0", lowStockCount: 0 };
  const stockList = stockData?.stock ?? [];
  const unreadAlerts = alertsData?.alerts ?? [];

  const selectedEntry = useMemo(
    () => stockEntries.find((e) => e.id === selectedEntryId),
    [stockEntries, selectedEntryId],
  );
  const selectedSupplierName = useMemo(() => {
    if (!selectedEntry?.supplierId) return null;
    return suppliers.find((p) => p.id === selectedEntry.supplierId)?.name ?? null;
  }, [selectedEntry?.supplierId, suppliers]);

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

  const handleViewEntry = useCallback((entryId: number) => {
    setSelectedEntryId(entryId);
    setDetailSheetOpen(true);
  }, []);

  const handleMarkAlertRead = useCallback(
    (id: number) => {
      markAlertRead.mutate(id);
    },
    [markAlertRead],
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Stock"
        description="View stock overview, add purchases, and manage entries"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab("add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("entries")}>
              <List className="mr-2 h-4 w-4" />
              Entries
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add">Add Stock</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ErrorBanner error={stockError} fallbackMessage="Failed to load stock" />
          {stockPending ? (
            <TableSkeleton rows={4} />
          ) : (
            <>
              <StockOverviewCards
                totalStockValue={summary.totalStockValue}
                lowStockCount={summary.lowStockCount}
                totalItems={stockData?.total ?? 0}
              />
              {unreadAlerts.length > 0 && (
                <StockAlertsBanner
                  alerts={unreadAlerts}
                  onMarkRead={handleMarkAlertRead}
                  markReadPending={markAlertRead.isPending}
                />
              )}
              <div>
                <h2 className="mb-3 text-base font-semibold">Stock list</h2>
                <StockReportTable rows={stockList} />
              </div>
            </>
          )}
        </TabsContent>

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

        <TabsContent value="entries">
          <p className="mb-4 text-sm text-muted-foreground">
            All stock entries (purchases/batches). Click a row or View to see details.
          </p>
          <ErrorBanner error={entriesError} fallbackMessage="Failed to load stock entries" />
          {entriesPending ? (
            <TableSkeleton rows={5} />
          ) : (
            <StockEntriesTable
              entries={stockEntries}
              items={items}
              suppliers={suppliers}
              onView={handleViewEntry}
            />
          )}
        </TabsContent>
      </Tabs>

      <StockEntryDetailSheet
        entryId={selectedEntryId}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) setSelectedEntryId(null);
        }}
        supplierName={selectedSupplierName}
      />
    </div>
  );
}
