"use client";

import { useCallback, useMemo, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import SearchInput from "@/components/SearchInput";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import AdjustStockDialog from "@/components/dialogs/AdjustStockDialog";
import { StockOverviewCards } from "@/components/items/StockOverviewCards";
import { StockReportTable } from "@/components/items/StockReportTable";
import { useDebounce } from "@/hooks/use-debounce";
import { useItems, useStockList } from "@/hooks/use-items";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { PAGE } from "@/constants/page-access";
import { reportItemRegister } from "@/lib/reports/report-labels";

export default function ItemRegisterPage() {
  const { can } = usePermissions();
  const canAdjustStock = can(P.item.adjust_stock);
  const canStockOverview = can(PAGE.stock_overview);
  const canStockLedger = can(PAGE.stock_ledger);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [adjustItemId, setAdjustItemId] = useState<number | null>(null);
  const [adjustItemName, setAdjustItemName] = useState<string>("");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  const { data: itemsData, isPending: itemsPending, error: itemsError } = useItems({ limit: 100 });
  const { data: stockDataForCards, isPending: stockCardsPending } = useStockList({
    limit: 1,
    enabled: canStockOverview,
  });
  const {
    data: stockData,
    isPending: stockPending,
    error: stockError,
  } = useStockList({ limit: 200, search: debouncedSearch || undefined });

  const summary = (canStockOverview ? stockDataForCards?.summary : undefined) ?? stockData?.summary;
  const totalPurchasedValue = summary?.stockValue?.totalPurchasedValue ?? "0";
  const totalItems = summary?.stockValue?.totalItems ?? 0;
  const totalQuantity = summary?.stockValue?.totalQuantity ?? "0";
  const lowStockCount = summary?.lowStock?.totalItems ?? 0;
  const lowStockQuantity = summary?.lowStock?.totalQuantity;
  const totalSellingValue = summary?.stockValue?.totalAmount ?? "0";

  const items = useMemo(
    () => (itemsData?.items ?? []).filter((i) => i.isActive),
    [itemsData?.items],
  );
  const stockList = stockData?.stock ?? [];

  const openAdjustStock = useCallback((itemId: number, itemName: string) => {
    setAdjustItemId(itemId);
    setAdjustItemName(itemName);
    setAdjustDialogOpen(true);
  }, []);

  const closeAdjustDialog = useCallback(() => {
    setAdjustDialogOpen(false);
    setAdjustItemId(null);
    setAdjustItemName("");
  }, []);

  const listPending = itemsPending || stockPending;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={reportItemRegister.title}
        description={reportItemRegister.description}
        backHref="/reports"
        backLabel="Back to reports"
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

      <ErrorBanner
        error={stockError ?? itemsError}
        fallbackMessage={reportItemRegister.loadError}
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Stock by item</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One row per item — total quantity and value.
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search items..."
          className="min-w-[180px]"
        />
      </div>

      {listPending ? (
        <TableSkeleton rows={5} />
      ) : (
        <StockReportTable
          rows={stockList}
          items={items}
          onAdjust={canAdjustStock ? openAdjustStock : undefined}
          showStockLedger={canStockLedger}
        />
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
        />
      )}
    </div>
  );
}
