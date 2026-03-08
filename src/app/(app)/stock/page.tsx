"use client";

import { useCallback, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { StockOverviewCards } from "@/components/items/StockOverviewCards";
import { StockAlertsBanner } from "@/components/items/StockAlertsBanner";
import { StockEntryGrid } from "@/components/items/StockEntryGrid";
import { StockReportTable } from "@/components/items/StockReportTable";
import { StockEntriesTable } from "@/components/items/StockEntriesTable";
import { StockEntryDetailSheet } from "@/components/items/StockEntryDetailSheet";
import AdjustStockDialog from "@/components/dialogs/AdjustStockDialog";
import EditStockEntryDialog from "@/components/dialogs/EditStockEntryDialog";
import {
  useItems,
  useStockList,
  useStockEntries,
  useCreateStockEntry,
  useUpdateStockEntry,
} from "@/hooks/use-items";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-alerts";
import type { CreateStockEntryRequest, StockEntry, UpdateStockEntryRequest } from "@/types/item";
import type { Party } from "@/types/party";
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
  const [entryToEdit, setEntryToEdit] = useState<StockEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: itemsData, isPending: itemsPending, error: itemsError } = useItems({ limit: 500 });
  // Unfiltered fetch for overview cards so they always show overall totals
  const { data: stockDataForCards, isPending: stockCardsPending } = useStockList({ limit: 1 });
  const {
    data: stockData,
    isPending: stockPending,
    error: stockError,
  } = useStockList({ limit: 200, search: debouncedSearch || undefined });
  const { data: alertsData } = useAlerts(true);
  const markAlertRead = useMarkAlertRead();
  const {
    data: stockEntriesData,
    isPending: entriesPending,
    error: entriesError,
  } = useStockEntries({ limit: 200, search: debouncedSearch || undefined });
  const createStockEntry = useCreateStockEntry();
  const updateStockEntry = useUpdateStockEntry();

  const items = (itemsData?.items ?? []).filter((i) => i.isActive);
  const stockEntries = useMemo(
    (): StockEntry[] => stockEntriesData?.entries ?? [],
    [stockEntriesData],
  );
  const allSuppliers = useMemo((): Party[] => {
    const map = new Map<number, Party>();

    for (const entry of stockEntries) {
      if (entry.supplierId == null) continue;
      const existing = map.get(entry.supplierId);
      const supplier: Party = {
        id: entry.supplierId,
        businessId: entry.businessId,
        name: entry.supplierName ?? existing?.name ?? `#${entry.supplierId}`,
        type: "SUPPLIER",
        gstin: null,
        email: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        postalCode: null,
        openingBalance: null,
        isActive: entry.supplierIsActive ?? existing?.isActive ?? true,
        createdAt: existing?.createdAt ?? entry.createdAt,
        updatedAt: existing?.updatedAt ?? entry.updatedAt,
      };
      map.set(entry.supplierId, supplier);
    }

    for (const row of stockData?.stock ?? []) {
      if (row.supplierId == null) continue;
      const existing = map.get(row.supplierId);
      const supplier: Party = {
        id: row.supplierId,
        businessId: existing?.businessId ?? 0,
        name: row.supplierName ?? existing?.name ?? `#${row.supplierId}`,
        type: "SUPPLIER",
        gstin: existing?.gstin ?? null,
        email: existing?.email ?? null,
        phone: existing?.phone ?? null,
        address: existing?.address ?? null,
        city: existing?.city ?? null,
        state: existing?.state ?? null,
        postalCode: existing?.postalCode ?? null,
        openingBalance: existing?.openingBalance ?? null,
        isActive: row.supplierIsActive ?? existing?.isActive ?? true,
        createdAt: existing?.createdAt ?? "",
        updatedAt: existing?.updatedAt ?? "",
      };
      map.set(row.supplierId, supplier);
    }

    return Array.from(map.values());
  }, [stockData?.stock, stockEntries]);
  const activeSuppliers = useMemo(
    () => allSuppliers.filter((supplier) => supplier.isActive),
    [allSuppliers],
  );

  // Cards always use overall (unfiltered) summary; list uses filtered data
  const summary = stockDataForCards?.summary ?? stockData?.summary;
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
    return allSuppliers.find((p) => p.id === selectedEntry.supplierId)?.name ?? null;
  }, [allSuppliers, selectedEntry?.supplierId]);

  const handleStockSubmit = useCallback(
    async (entries: CreateStockEntryRequest[]): Promise<StockEntry[]> => {
      try {
        const created: StockEntry[] = [];
        for (const entry of entries) {
          const saved = await createStockEntry.mutateAsync(entry);
          created.push(saved);
        }
        showSuccessToast(entries.length === 1 ? "Stock entry saved" : "Stock entries saved");
        return created;
      } catch (err) {
        showErrorToast(err, "Failed to save stock entries");
        throw err;
      }
    },
    [createStockEntry],
  );

  const openEditStockEntry = useCallback((entry: StockEntry) => {
    setEntryToEdit(entry);
    setEditDialogOpen(true);
  }, []);

  const handleEditStockEntry = useCallback(
    async (entryId: number, data: UpdateStockEntryRequest) => {
      try {
        const updated = await updateStockEntry.mutateAsync({ entryId, data });
        showSuccessToast("Stock entry updated");
        return updated;
      } catch (err) {
        showErrorToast(
          err,
          "Failed to update stock entry. If API is missing, please add update endpoint.",
        );
        throw err;
      }
    },
    [updateStockEntry],
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

      {/* Cards visible on all tabs — always show overall (unfiltered) data */}
      <div className="mb-6">
        {stockCardsPending && !stockDataForCards ? (
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
          {/* Keep search and toolbar mounted so focus is not lost when list refetches */}
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
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search stock..."
                    className="min-w-[180px]"
                  />
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
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
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
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
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
              </div>
              <ErrorBanner
                error={listViewMode === "stock" ? entriesError : undefined}
                fallbackMessage="Failed to load stock entries"
              />
              {listPending ? (
                <TableSkeleton rows={5} />
              ) : listViewMode === "item" ? (
                <StockReportTable rows={stockList} items={items} onAdjust={openAdjustStock} />
              ) : (
                <StockEntriesTable
                  entries={stockEntries}
                  items={items}
                  onView={handleViewEntry}
                  onAdjust={openAdjustStock}
                  onEditEntry={openEditStockEntry}
                />
              )}
            </div>
          </>
        </TabsContent>

        <TabsContent value="add">
          <p className="mb-4 text-sm text-muted-foreground">
            Enter item details, then click &quot;Add row&quot; to save that stock entry and open a
            fresh row. Added entries are shown in the session grid below.
          </p>
          <ErrorBanner error={itemsError} fallbackMessage="Failed to load items" />
          {itemsPending ? (
            <TableSkeleton rows={3} />
          ) : (
            <StockEntryGrid
              items={items}
              suppliers={activeSuppliers}
              onSubmit={handleStockSubmit}
              onEditSessionEntry={handleEditStockEntry}
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
        items={items}
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

      <EditStockEntryDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEntryToEdit(null);
        }}
        entry={
          entryToEdit
            ? {
                id: entryToEdit.id,
                itemName:
                  entryToEdit.itemName ??
                  entryToEdit.item?.name ??
                  items.find((item) => item.id === entryToEdit.itemId)?.name ??
                  `#${entryToEdit.itemId}`,
                itemType:
                  entryToEdit.itemType ??
                  items.find((item) => item.id === entryToEdit.itemId)?.type ??
                  "STOCK",
                unit: entryToEdit.unit,
                purchaseDate: entryToEdit.purchaseDate,
                sellingPrice: entryToEdit.sellingPrice ?? "",
                purchasePrice: entryToEdit.purchasePrice,
                supplierId: entryToEdit.supplierId,
              }
            : null
        }
        suppliers={allSuppliers}
        onSave={handleEditStockEntry}
      />
    </div>
  );
}
