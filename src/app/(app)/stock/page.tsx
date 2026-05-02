"use client";

import { useCallback, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { StockOverviewCards } from "@/components/items/StockOverviewCards";
import { StockAlertsBanner } from "@/components/items/StockAlertsBanner";
import { StockEntryGrid } from "@/components/items/StockEntryGrid";
import { StockEntriesTable } from "@/components/items/StockEntriesTable";
import AdjustStockDialog from "@/components/dialogs/AdjustStockDialog";
import EditStockEntryDialog from "@/components/dialogs/EditStockEntryDialog";
import {
  useItems,
  useStockList,
  useStockEntries,
  useCreateStockEntry,
  useUpdateStockEntry,
} from "@/hooks/use-items";
import { useParties } from "@/hooks/use-parties";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-alerts";
import type { CreateStockEntryRequest, StockEntry, UpdateStockEntryRequest } from "@/types/item";
import type { Party } from "@/types/party";
import { showSuccessToast, showErrorToast } from "@/lib/ui/toast-helpers";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { PAGE } from "@/constants/page-access";

export default function Stock() {
  const { can } = usePermissions();
  const canManageStock = can(P.item.stock.manage);
  const canAdjustStock = can(P.item.adjust_stock);
  const canSeeAlerts = can(P.alerts.view);
  const canManageAlerts = can(P.alerts.manage);
  const canStockOverview = can(PAGE.stock_overview);
  const canStockLedger = can(PAGE.stock_ledger);
  const searchParams = useSearchParams();
  const stockView = searchParams.get("view");
  const [adjustItemId, setAdjustItemId] = useState<number | null>(null);
  const [adjustItemName, setAdjustItemName] = useState<string>("");
  const [adjustStockEntryId, setAdjustStockEntryId] = useState<number | undefined>(undefined);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<StockEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: itemsData, isPending: itemsPending, error: itemsError } = useItems({ limit: 100 });
  const { data: stockDataForCards, isPending: stockCardsPending } = useStockList({
    limit: 1,
    enabled: canStockOverview,
  });
  const { data: stockData, error: stockError } = useStockList({
    limit: 200,
    search: debouncedSearch || undefined,
  });
  const { data: alertsData } = useAlerts(true, canSeeAlerts, { limit: 500 });
  const markAlertRead = useMarkAlertRead();
  const {
    data: stockEntriesData,
    isPending: entriesPending,
    error: entriesError,
  } = useStockEntries({ limit: 200, search: debouncedSearch || undefined });
  const createStockEntry = useCreateStockEntry();
  const updateStockEntry = useUpdateStockEntry();
  const { data: suppliersData } = useParties({
    type: "SUPPLIER",
    includeInactive: false,
    limit: 200,
  });

  const items = useMemo(
    () => (itemsData?.items ?? []).filter((i) => i.isActive),
    [itemsData?.items],
  );
  const prefillItemId = Number(searchParams.get("addItemId") ?? "");
  const prefillItem =
    Number.isFinite(prefillItemId) && prefillItemId > 0
      ? (items.find((item) => item.id === prefillItemId) ?? null)
      : null;
  const showAddStockView = canManageStock && (stockView === "add" || prefillItemId > 0);

  const { data: stockDataForLowFlags } = useStockList({
    limit: 500,
    enabled: !showAddStockView,
  });

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
        name: entry.supplierName ?? existing?.name ?? "Unknown vendor",
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
        name: row.supplierName ?? existing?.name ?? "Unknown vendor",
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
  const activeSuppliers = useMemo(() => suppliersData?.parties ?? [], [suppliersData?.parties]);

  const summary = (canStockOverview ? stockDataForCards?.summary : undefined) ?? stockData?.summary;
  const totalPurchasedValue = summary?.stockValue?.totalPurchasedValue ?? "0";
  const totalItems = summary?.stockValue?.totalItems ?? 0;
  const totalQuantity = summary?.stockValue?.totalQuantity ?? "0";
  const lowStockCount = summary?.lowStock?.totalItems ?? 0;
  const lowStockQuantity = summary?.lowStock?.totalQuantity;
  const totalSellingValue = summary?.stockValue?.totalAmount ?? "0";
  const unreadAlerts = useMemo(() => alertsData?.alerts ?? [], [alertsData?.alerts]);

  const lowStockItemIds = useMemo(() => {
    const s = new Set<number>();
    for (const row of stockDataForLowFlags?.stock ?? []) {
      if (row.isLowStock === true) s.add(row.itemId);
    }
    return s;
  }, [stockDataForLowFlags?.stock]);

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
        showErrorToast(err, "Couldn't save stock entries");
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
        showErrorToast(err, "Couldn’t save this stock change. Please try again.");
        throw err;
      }
    },
    [updateStockEntry],
  );

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

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Stock"
        description={
          showAddStockView
            ? "Add new stock entries for your items"
            : "View stock entries, add purchases, and adjust quantities. Summarize by item in Reports → Item register."
        }
      />

      {canStockOverview ? (
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
      ) : null}

      {!showAddStockView && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Overview</h2>
            {canManageStock && (
              <Button asChild>
                <Link href="/stock?view=add">Add Stock</Link>
              </Button>
            )}
          </div>

          <ErrorBanner error={stockError} fallbackMessage="Failed to load stock" />
          {/* Keep search and toolbar mounted so focus is not lost when list refetches */}
          <>
            {canSeeAlerts && unreadAlerts.length > 0 && (
              <StockAlertsBanner
                alerts={unreadAlerts}
                onMarkRead={canManageAlerts ? handleMarkAlertRead : undefined}
                markReadPending={canManageAlerts ? markAlertRead.isPending : false}
              />
            )}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">Stock list</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">One row per stock entry.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search stock..."
                    className="min-w-[180px]"
                  />
                </div>
              </div>
              <ErrorBanner error={entriesError} fallbackMessage="Failed to load stock entries" />
              {entriesPending ? (
                <TableSkeleton rows={5} />
              ) : (
                <StockEntriesTable
                  entries={stockEntries}
                  items={items}
                  lowStockItemIds={lowStockItemIds}
                  onAdjust={canAdjustStock ? openAdjustStock : undefined}
                  onEditEntry={canManageStock ? openEditStockEntry : undefined}
                  showStockLedger={canStockLedger}
                />
              )}
            </div>
          </>
        </section>
      )}

      {canManageStock && showAddStockView && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Add Stock</h2>
            <Button variant="outline" asChild>
              <Link href="/stock">Back to Overview</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
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
              prefillItem={prefillItem}
              onSubmit={handleStockSubmit}
              onEditSessionEntry={handleEditStockEntry}
              isSubmitting={createStockEntry.isPending}
            />
          )}
        </section>
      )}

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
                  "Unnamed item",
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
