import { useCallback, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers } from "lucide-react";
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
import AdjustStockDialog from "@/components/items/AdjustStockDialog";
import { useItems, useStockList, useStockEntries, useCreateStockEntry } from "@/hooks/use-items";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-alerts";
import { useParties } from "@/hooks/use-parties";
import type { CreateStockEntryRequest, StockEntry } from "@/types/item";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";
import { cn } from "@/lib/utils";

type ListViewMode = "item" | "stock";

export default function Stock() {
  const [activeTab, setActiveTab] = useState("overview");
  const [listViewMode, setListViewMode] = useState<ListViewMode>("item");
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [adjustItemId, setAdjustItemId] = useState<number | null>(null);
  const [adjustItemName, setAdjustItemName] = useState<string>("");
  const [adjustStockEntryId, setAdjustStockEntryId] = useState<number | undefined>(undefined);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  const { data: itemsData, isPending: itemsPending, error: itemsError } = useItems({ limit: 500 });
  const {
    data: stockData,
    isPending: stockPending,
    error: stockError,
  } = useStockList({ limit: 200 });
  const { data: alertsData } = useAlerts(true);
  const markAlertRead = useMarkAlertRead();
  const {
    data: stockEntriesData,
    isPending: entriesPending,
    error: entriesError,
  } = useStockEntries({ limit: 200 });
  const { data: partiesData } = useParties();
  const createStockEntry = useCreateStockEntry();

  const items = (itemsData?.items ?? []).filter((i) => !i.deletedAt);
  const suppliers = (partiesData?.parties ?? []).filter(
    (p) => !p.deletedAt && p.type === "SUPPLIER",
  );
  const stockEntries = useMemo(
    (): StockEntry[] => stockEntriesData?.entries ?? [],
    [stockEntriesData],
  );

  const summary = stockData?.summary;
  const totalPurchasedValue = summary?.stockValue?.totalPurchasedValue ?? "0";
  const totalItems = summary?.stockValue?.totalItems ?? 0;
  const totalQuantity = summary?.stockValue?.totalQuantity ?? "0";
  const lowStockCount = summary?.lowStock?.totalItems ?? 0;
  const lowStockQuantity = summary?.lowStock?.totalQuantity;
  const totalSellingValue = summary?.stockValue?.totalAmount ?? "0";
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

  const openAdjustStock = useCallback((itemId: number, itemName: string, stockEntryId?: number) => {
    setAdjustItemId(itemId);
    setAdjustItemName(itemName);
    setAdjustStockEntryId(stockEntryId);
    setAdjustDialogOpen(true);
  }, []);

  const closeAdjustDialog = useCallback(() => {
    setAdjustDialogOpen(false);
    setAdjustItemId(null);
    setAdjustItemName("");
    setAdjustStockEntryId(undefined);
  }, []);

  const listPending = listViewMode === "item" ? stockPending : entriesPending;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Stock"
        description="View stock by item or by stock entry, add purchases, and adjust quantities"
      />

      {/* Cards visible on all tabs */}
      <div className="mb-6">
        {stockPending && !stockData ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-[88px] animate-pulse rounded-2xl border bg-muted/50" />
            <div className="h-[88px] animate-pulse rounded-2xl border bg-muted/50" />
            <div className="h-[88px] animate-pulse rounded-2xl border bg-muted/50" />
          </div>
        ) : (
          <StockOverviewCards
            totalPurchasedValue={totalPurchasedValue}
            totalItems={totalItems}
            totalQuantity={totalQuantity}
            lowStockCount={lowStockCount}
            lowStockQuantity={lowStockQuantity}
            totalSellingValue={totalSellingValue}
          />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add">Add Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ErrorBanner error={stockError} fallbackMessage="Failed to load stock" />
          {stockPending ? (
            <TableSkeleton rows={4} />
          ) : (
            <>
              {unreadAlerts.length > 0 && (
                <StockAlertsBanner
                  alerts={unreadAlerts}
                  onMarkRead={handleMarkAlertRead}
                  markReadPending={markAlertRead.isPending}
                />
              )}
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Stock list</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {listViewMode === "item"
                        ? "One row per item (total quantity and value)."
                        : "One row per stock entry. Click a row to see details."}
                    </p>
                  </div>
                  <div
                    className="flex rounded-lg border border-border bg-muted/30 p-0.5"
                    role="tablist"
                    aria-label="List view"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                        listViewMode === "item"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setListViewMode("item")}
                      aria-pressed={listViewMode === "item"}
                    >
                      <Package className="h-3.5 w-3.5" />
                      By item
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                        listViewMode === "stock"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setListViewMode("stock")}
                      aria-pressed={listViewMode === "stock"}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      By stock
                    </Button>
                  </div>
                </div>
                <ErrorBanner
                  error={listViewMode === "stock" ? entriesError : undefined}
                  fallbackMessage="Failed to load stock entries"
                />
                {listPending ? (
                  <TableSkeleton rows={5} />
                ) : listViewMode === "item" ? (
                  <StockReportTable rows={stockList} onAdjust={openAdjustStock} />
                ) : (
                  <StockEntriesTable
                    entries={stockEntries}
                    items={items}
                    suppliers={suppliers}
                    onView={handleViewEntry}
                    onAdjust={openAdjustStock}
                  />
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="add">
          <p className="mb-4 text-sm text-muted-foreground">
            Enter item, quantity, and date; then click &quot;Add stock&quot; to save. Each entry is
            saved immediately. The table below lists what you&apos;ve added in this session.
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

      {adjustItemId != null && (
        <AdjustStockDialog
          open={adjustDialogOpen}
          onOpenChange={(open) => {
            setAdjustDialogOpen(open);
            if (!open) closeAdjustDialog();
          }}
          itemId={adjustItemId}
          itemName={adjustItemName}
          stockEntryId={adjustStockEntryId}
        />
      )}
    </div>
  );
}
