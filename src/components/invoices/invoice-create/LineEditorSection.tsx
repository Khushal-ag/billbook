"use client";

import { useMemo } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInvoiceTypeCreateCopy, isSalesFamily } from "@/lib/invoice";
import {
  formatIgstFromCgstSgst,
  getEntryDateIso,
  getLineAmounts,
  getSalesUnitPriceFloor,
  toNum,
} from "@/lib/invoice-create";
import { getReturnQuantityCap, isReturnQuantityOverCap } from "@/lib/invoice-return-cap";
import { formatISODateDisplay } from "@/lib/date";
import { cn, formatCurrency } from "@/lib/utils";
import type { InvoiceLineDraft, StockChoice, StockLineIssue } from "@/types/invoice-create";
import type { Item, StockEntry } from "@/types/item";
import type { InvoiceType } from "@/types/invoice";
import { StockSearchPopover } from "./StockSearchPopover";

/** Form row: readable labels (grid has more room than table columns). */
const draftLabelClass = "mb-2 block text-sm font-medium text-foreground";

/** Table headers: one line, no wrap; normal case reads better than tiny uppercase. */
const thLeft =
  "whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-foreground lg:text-[13px]";
const thRight =
  "whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium text-foreground lg:text-[13px]";
const thCenter =
  "whitespace-nowrap px-3 py-2.5 text-center text-xs font-medium text-foreground lg:text-[13px]";

interface LineEditorSectionProps {
  invoiceType: InvoiceType;
  draftLine: InvoiceLineDraft;
  addedLines: InvoiceLineDraft[];
  stockSearchOpen: boolean;
  setStockSearchOpen: (open: boolean) => void;
  stockSearchText: string;
  setStockSearchText: (value: string) => void;
  stockEntries: StockEntry[];
  filteredStockChoices: StockChoice[];
  itemsWithoutStockOptions: Item[];
  showAddItemOption: boolean;
  onSelectChoice: (lineId: string, choice: StockChoice) => void;
  onAddStockForItem: (item: Item) => void;
  onAddNewItem: () => void;
  onLineQuantityChange: (lineId: string, quantity: string) => void;
  onLineDiscountChange: (lineId: string, value: string) => void;
  onLineDiscountAmountChange: (lineId: string, value: string) => void;
  /** Patch any field on a line (draft or added). */
  updateLine: (lineId: string, patch: Partial<InvoiceLineDraft>) => void;
  addCurrentLine: () => Promise<void>;
  removeAddedLine: (lineId: string) => void;
  applySuggestedQtyForLine: (lineId: string) => void;
  stockLineIssues: Record<string, StockLineIssue>;
  focusedIssueLineId: string | null;
  qtyAutoAdjusted: boolean;
  unitPriceFloorWarning?: string | null;
  unitPriceFloorIsError?: boolean;
  /** Purchase invoice: updates purchase rate and selling price when margin is set. */
  onPurchaseUnitPriceChange?: (lineId: string, value: string) => void;
  /** Sales invoice: keeps unit price editable and validates floor when focus leaves field. */
  onSalesUnitPriceChange?: (lineId: string, value: string) => void;
  onSalesUnitPriceBlur?: (lineId: string) => void;
  /** Linked sale/purchase return: show when return qty exceeds remaining (blocks save). */
  returnValidationWarning?: string | null;
}

export function LineEditorSection({
  invoiceType,
  draftLine,
  addedLines,
  stockSearchOpen,
  setStockSearchOpen,
  stockSearchText,
  setStockSearchText,
  stockEntries,
  filteredStockChoices,
  itemsWithoutStockOptions,
  showAddItemOption,
  onSelectChoice,
  onAddStockForItem,
  onAddNewItem,
  onLineQuantityChange,
  onLineDiscountChange,
  onLineDiscountAmountChange,
  updateLine,
  addCurrentLine,
  removeAddedLine,
  applySuggestedQtyForLine,
  stockLineIssues,
  focusedIssueLineId,
  qtyAutoAdjusted,
  unitPriceFloorWarning,
  unitPriceFloorIsError,
  onPurchaseUnitPriceChange,
  onSalesUnitPriceChange,
  onSalesUnitPriceBlur,
  returnValidationWarning,
}: LineEditorSectionProps) {
  const copy = getInvoiceTypeCreateCopy(invoiceType);
  const isSaleReturn = invoiceType === "SALE_RETURN";
  const purchaseFamilyForm = !isSalesFamily(invoiceType);
  /** Purchase bill lines: cost + selling columns. */
  const isPurchaseCostLine =
    invoiceType === "PURCHASE_INVOICE" || invoiceType === "PURCHASE_RETURN";
  const isPurchaseReturn = invoiceType === "PURCHASE_RETURN";
  const batchRequired = isSalesFamily(invoiceType);
  const unitPriceEditable = true;
  const draftGstDerived =
    purchaseFamilyForm && (draftLine.cgstRate.trim() !== "" || draftLine.sgstRate.trim() !== "");
  const salesUnitPriceFloor = useMemo(
    () => getSalesUnitPriceFloor(draftLine, stockEntries),
    [draftLine, stockEntries],
  );
  const purchaseGridStyle = useMemo(
    () =>
      isPurchaseCostLine
        ? {
            gridTemplateColumns:
              "minmax(9.5rem, 1.15fr) minmax(8.5rem, 1.05fr) minmax(3.75rem, 0.36fr) minmax(3.75rem, 0.36fr) minmax(3rem, 0.32fr) minmax(5rem, 0.52fr) minmax(4.25rem, 0.44fr) minmax(3.75rem, 0.42fr) minmax(4.25rem, 0.46fr) minmax(2.85rem, 0.3fr) minmax(2.85rem, 0.3fr) minmax(2.85rem, 0.3fr) minmax(4.5rem, 0.5fr) minmax(4.5rem, 0.5fr) minmax(4.5rem, 0.5fr) auto",
          }
        : {
            gridTemplateColumns:
              "minmax(9.5rem, 1.15fr) minmax(8.5rem, 1.05fr) minmax(3.75rem, 0.36fr) minmax(3.75rem, 0.36fr) minmax(3rem, 0.32fr) minmax(5rem, 0.52fr) minmax(3.75rem, 0.42fr) minmax(4.25rem, 0.46fr) minmax(2.85rem, 0.3fr) minmax(2.85rem, 0.3fr) minmax(2.85rem, 0.3fr) minmax(4.5rem, 0.5fr) minmax(4.5rem, 0.5fr) minmax(4.5rem, 0.5fr) auto",
          },
    [isPurchaseCostLine],
  );

  const addedLinesTotals = useMemo(() => {
    return addedLines.reduce(
      (acc, line) => {
        const t = getLineAmounts(line);
        acc.lineDiscount += t.lineDiscount;
        acc.taxable += t.taxable;
        acc.tax += t.tax;
        acc.net += t.total;
        return acc;
      },
      { lineDiscount: 0, taxable: 0, tax: 0, net: 0 },
    );
  }, [addedLines]);

  const triggerLabel = draftLine.stockEntryId ? (
    <span className="truncate">
      {draftLine.item?.name ?? "Item"} | Batch{" "}
      {formatISODateDisplay(
        getEntryDateIso(
          stockEntries.find((entry) => entry.id === draftLine.stockEntryId) ??
            ({ purchaseDate: "", createdAt: "" } as StockEntry),
        ),
      ) || "No date"}
    </span>
  ) : purchaseFamilyForm ? (
    <span className="truncate text-left text-muted-foreground">
      Optional batch — prefill from stock
    </span>
  ) : (
    <span className="text-muted-foreground">{copy.batchPlaceholder}</span>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          {copy.itemSectionTitle}
        </CardTitle>
        {copy.itemSectionHelper && (
          <p className="mt-1 text-xs font-normal text-muted-foreground">{copy.itemSectionHelper}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {returnValidationWarning ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{returnValidationWarning}</AlertDescription>
          </Alert>
        ) : null}
        {invoiceType === "SALE_INVOICE" && unitPriceFloorWarning ? (
          <Alert
            variant={unitPriceFloorIsError ? "destructive" : "default"}
            className={cn(unitPriceFloorIsError ? "" : "border-amber-200 bg-amber-50")}
          >
            <AlertTriangle
              className={cn("h-4 w-4", unitPriceFloorIsError ? "" : "text-amber-600")}
            />
            <AlertDescription className={cn(unitPriceFloorIsError ? "" : "text-amber-800")}>
              {unitPriceFloorWarning}
            </AlertDescription>
          </Alert>
        ) : null}
        {isSaleReturn ? (
          addedLines.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No sale lines loaded. Use <strong>Return</strong> on a sales invoice so items from
              that bill appear here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full min-w-[800px] text-sm" aria-label="Sales return lines">
                <thead className="border-b bg-muted/90">
                  <tr className="[&_th]:py-2.5 [&_th]:text-xs [&_th]:font-medium">
                    <th scope="col" className="w-10 pl-3 text-center">
                      <span className="sr-only">Include</span>
                    </th>
                    <th scope="col" className={cn(thLeft, "pl-2")}>
                      Item
                    </th>
                    <th scope="col" className={thLeft}>
                      HSN/SAC
                    </th>
                    <th scope="col" className={thLeft}>
                      Batch
                    </th>
                    <th scope="col" className={thRight}>
                      Remaining
                    </th>
                    <th scope="col" className={thRight}>
                      Unit price
                    </th>
                    <th scope="col" className={thRight}>
                      Return qty
                    </th>
                    <th scope="col" className={cn(thRight, "pr-4")}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {addedLines.map((line) => {
                    const selected = line.selectedForReturn !== false;
                    const lineEntry = stockEntries.find((entry) => entry.id === line.stockEntryId);
                    const totals = getLineAmounts(line);
                    const overCap = selected && isReturnQuantityOverCap(line);
                    const capHint = getReturnQuantityCap(line);
                    const displayName = line.itemName.trim() || line.item?.name?.trim() || "—";
                    const hsnSac = line.hsnCode.trim()
                      ? line.hsnCode
                      : line.sacCode.trim()
                        ? line.sacCode
                        : line.item?.hsnCode?.trim()
                          ? line.item.hsnCode
                          : line.item?.sacCode?.trim()
                            ? line.item.sacCode
                            : "—";
                    return (
                      <tr
                        key={line.id}
                        className={cn(
                          "border-b last:border-0",
                          !selected && "bg-muted/30 text-muted-foreground",
                          overCap && "bg-destructive/[0.06]",
                        )}
                      >
                        <td className="py-2 pl-3 text-center">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(v) =>
                              updateLine(line.id, { selectedForReturn: v === true })
                            }
                            aria-label={`Include ${displayName} in this return`}
                          />
                        </td>
                        <td className="px-2 py-2.5 font-medium text-foreground">{displayName}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{hsnSac}</td>
                        <td className="px-3 py-2.5 text-xs">
                          {lineEntry
                            ? formatISODateDisplay(getEntryDateIso(lineEntry)) || "No date"
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {line.remainingReturnableQty?.trim()
                            ? line.remainingReturnableQty
                            : line.soldQuantity?.trim()
                              ? line.soldQuantity
                              : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="px-3 py-2.5 text-right align-top">
                          <div className="inline-flex flex-col items-end">
                            <Input
                              value={line.quantity}
                              onChange={(e) => onLineQuantityChange(line.id, e.target.value)}
                              disabled={!selected}
                              aria-invalid={overCap}
                              className={cn(
                                "inline-block h-8 w-[4.25rem] px-2 py-1 text-right text-xs tabular-nums",
                                overCap && "border-destructive ring-1 ring-destructive/25",
                              )}
                              aria-label={`Return quantity for ${displayName}`}
                            />
                            {overCap && capHint != null ? (
                              <span className="mt-1 max-w-[9rem] text-right text-[11px] leading-tight text-destructive">
                                Max {capHint}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 pr-4 text-right font-medium tabular-nums text-foreground">
                          {selected && toNum(line.quantity) > 0
                            ? formatCurrency(totals.total)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : purchaseFamilyForm ? (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <p className="sr-only">
              New line fields scroll horizontally when they do not fit on screen.
            </p>
            <div className="grid w-max min-w-full items-end gap-3 p-3" style={purchaseGridStyle}>
              <div className="min-w-0">
                <Label className={draftLabelClass} required={batchRequired}>
                  {copy.batchLabel}
                </Label>
                <StockSearchPopover
                  open={stockSearchOpen}
                  onOpenChange={setStockSearchOpen}
                  searchText={stockSearchText}
                  onSearchChange={setStockSearchText}
                  triggerLabel={triggerLabel}
                  triggerClassName="h-9 text-sm"
                  draftLineStockEntryId={draftLine.stockEntryId}
                  filteredStockChoices={filteredStockChoices}
                  itemsWithoutStockOptions={itemsWithoutStockOptions}
                  showAddItemOption={showAddItemOption}
                  onSelectChoice={onSelectChoice}
                  onAddStockForItem={onAddStockForItem}
                  onAddNewItem={onAddNewItem}
                  draftLineId={draftLine.id}
                />
              </div>
              <div className="min-w-0">
                <Label className={draftLabelClass} required>
                  Item
                </Label>
                <Input
                  value={draftLine.itemName}
                  onChange={(e) => updateLine(draftLine.id, { itemName: e.target.value })}
                  placeholder={
                    draftLine.stockEntryId ? "Override catalog name if needed" : "As on vendor bill"
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>HSN</Label>
                <Input
                  value={draftLine.hsnCode}
                  onChange={(e) => updateLine(draftLine.id, { hsnCode: e.target.value })}
                  placeholder="—"
                  className="h-9 text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>SAC</Label>
                <Input
                  value={draftLine.sacCode}
                  onChange={(e) => updateLine(draftLine.id, { sacCode: e.target.value })}
                  placeholder="—"
                  className="h-9 text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>Qty</Label>
                <Input
                  value={draftLine.quantity}
                  onChange={(e) => onLineQuantityChange(draftLine.id, e.target.value)}
                  className={cn(
                    "h-9 text-right text-sm tabular-nums transition-colors",
                    qtyAutoAdjusted &&
                      "animate-pulse bg-amber-50 ring-2 ring-amber-300 focus-visible:ring-amber-400",
                  )}
                />
              </div>
              <div>
                <Label className={draftLabelClass} required>
                  {isPurchaseCostLine ? "Purchase ₹" : "Unit"}
                </Label>
                <Input
                  value={draftLine.unitPrice}
                  onChange={(e) =>
                    isPurchaseCostLine && onPurchaseUnitPriceChange
                      ? onPurchaseUnitPriceChange(draftLine.id, e.target.value)
                      : updateLine(draftLine.id, { unitPrice: e.target.value })
                  }
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              {isPurchaseCostLine ? (
                <div>
                  <Label className={draftLabelClass}>Selling ₹</Label>
                  <Input
                    value={draftLine.sellingPrice ?? ""}
                    onChange={(e) => updateLine(draftLine.id, { sellingPrice: e.target.value })}
                    placeholder="Auto"
                    className="h-9 text-right text-sm tabular-nums"
                  />
                </div>
              ) : null}
              <div>
                <Label className={draftLabelClass}>Disc %</Label>
                <Input
                  value={draftLine.discountPercent}
                  onChange={(e) => onLineDiscountChange(draftLine.id, e.target.value)}
                  placeholder="0"
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>Disc ₹</Label>
                <Input
                  value={draftLine.discountAmount}
                  onChange={(e) => onLineDiscountAmountChange(draftLine.id, e.target.value)}
                  placeholder="0"
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>CGST %</Label>
                <Input
                  value={draftLine.cgstRate}
                  onChange={(e) => {
                    const cgstRate = e.target.value;
                    const patch: Partial<InvoiceLineDraft> = { cgstRate };
                    if (cgstRate.trim() !== "" || draftLine.sgstRate.trim() !== "") {
                      patch.igstRate = formatIgstFromCgstSgst(cgstRate, draftLine.sgstRate);
                    }
                    updateLine(draftLine.id, patch);
                  }}
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>SGST %</Label>
                <Input
                  value={draftLine.sgstRate}
                  onChange={(e) => {
                    const sgstRate = e.target.value;
                    const patch: Partial<InvoiceLineDraft> = { sgstRate };
                    if (draftLine.cgstRate.trim() !== "" || sgstRate.trim() !== "") {
                      patch.igstRate = formatIgstFromCgstSgst(draftLine.cgstRate, sgstRate);
                    }
                    updateLine(draftLine.id, patch);
                  }}
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>IGST %</Label>
                <Input
                  value={
                    draftGstDerived
                      ? formatIgstFromCgstSgst(draftLine.cgstRate, draftLine.sgstRate)
                      : draftLine.igstRate
                  }
                  title={
                    draftGstDerived
                      ? "Computed as CGST % + SGST %"
                      : "Enter IGST %, or fill CGST and SGST to calculate automatically"
                  }
                  readOnly={draftGstDerived}
                  onChange={(e) =>
                    !draftGstDerived && updateLine(draftLine.id, { igstRate: e.target.value })
                  }
                  className={cn(
                    "h-9 text-right text-sm tabular-nums",
                    draftGstDerived && "cursor-default bg-muted/50",
                  )}
                />
              </div>
              <div>
                <Label className={draftLabelClass}>Taxable</Label>
                <Input
                  value={formatCurrency(getLineAmounts(draftLine).taxable)}
                  disabled
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>Tax</Label>
                <Input
                  value={formatCurrency(getLineAmounts(draftLine).tax)}
                  disabled
                  className="h-9 text-right text-sm tabular-nums"
                />
              </div>
              <div>
                <Label className={draftLabelClass}>Net</Label>
                <Input
                  value={formatCurrency(getLineAmounts(draftLine).total)}
                  disabled
                  className="h-9 text-right text-sm font-medium tabular-nums"
                />
              </div>
              <div className="flex items-end justify-end pb-0.5">
                <Button type="button" onClick={addCurrentLine} size="sm" className="h-9 shrink-0">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 rounded-lg border p-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,.65fr)_minmax(0,.95fr)_minmax(0,.85fr)_minmax(0,.85fr)_minmax(0,.95fr)_minmax(0,.95fr)_minmax(0,.95fr)_auto] xl:items-end">
            <div>
              <Label className={draftLabelClass} required={batchRequired}>
                {copy.batchLabel}
              </Label>
              <StockSearchPopover
                open={stockSearchOpen}
                onOpenChange={setStockSearchOpen}
                searchText={stockSearchText}
                onSearchChange={setStockSearchText}
                triggerLabel={triggerLabel}
                draftLineStockEntryId={draftLine.stockEntryId}
                filteredStockChoices={filteredStockChoices}
                itemsWithoutStockOptions={itemsWithoutStockOptions}
                showAddItemOption={showAddItemOption}
                onSelectChoice={onSelectChoice}
                onAddStockForItem={onAddStockForItem}
                onAddNewItem={onAddNewItem}
                draftLineId={draftLine.id}
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Quantity</Label>
              <Input
                value={draftLine.quantity}
                onChange={(e) => onLineQuantityChange(draftLine.id, e.target.value)}
                className={cn(
                  "text-right tabular-nums transition-colors",
                  qtyAutoAdjusted &&
                    "animate-pulse bg-amber-50 ring-2 ring-amber-300 focus-visible:ring-amber-400",
                )}
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Unit price</Label>
              <Input
                value={draftLine.unitPrice}
                disabled={!unitPriceEditable}
                onChange={(e) =>
                  purchaseFamilyForm
                    ? updateLine(draftLine.id, { unitPrice: e.target.value })
                    : onSalesUnitPriceChange?.(draftLine.id, e.target.value)
                }
                onBlur={() => {
                  if (!purchaseFamilyForm) onSalesUnitPriceBlur?.(draftLine.id);
                }}
                className={cn(
                  "text-right tabular-nums",
                  !purchaseFamilyForm && "border-border bg-background",
                  invoiceType === "SALE_INVOICE" &&
                    unitPriceFloorWarning &&
                    (unitPriceFloorIsError
                      ? "border-destructive ring-1 ring-destructive/30 focus-visible:ring-destructive"
                      : "border-amber-500 ring-1 ring-amber-300 focus-visible:ring-amber-400"),
                )}
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Discount (%)</Label>
              <Input
                value={draftLine.discountPercent}
                onChange={(e) => onLineDiscountChange(draftLine.id, e.target.value)}
                placeholder="0"
                className="text-right tabular-nums"
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Discount (₹)</Label>
              <Input
                value={draftLine.discountAmount}
                onChange={(e) => onLineDiscountAmountChange(draftLine.id, e.target.value)}
                placeholder="0"
                className="text-right tabular-nums"
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Taxable</Label>
              <Input
                value={formatCurrency(getLineAmounts(draftLine).taxable)}
                disabled
                className="text-right"
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Tax</Label>
              <Input
                value={formatCurrency(getLineAmounts(draftLine).tax)}
                disabled
                className="text-right"
              />
            </div>

            <div>
              <Label className={draftLabelClass}>Net</Label>
              <Input
                value={formatCurrency(getLineAmounts(draftLine).total)}
                disabled
                className="text-right"
              />
            </div>

            <div className="flex items-end justify-end">
              <Button type="button" onClick={addCurrentLine} className="w-full xl:w-auto">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>
        )}

        {!isSaleReturn && addedLines.length > 0 && (
          <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
            <table
              className={cn(
                "w-full text-sm",
                isPurchaseCostLine ? "min-w-[1120px]" : "min-w-[1000px]",
              )}
              aria-label="Added invoice items"
            >
              <thead className="sticky top-0 z-10 border-b bg-muted/90 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/75">
                <tr className="[&_th]:align-bottom">
                  <th scope="col" className={cn(thLeft, "min-w-[9rem] pl-4")}>
                    Item
                  </th>
                  <th scope="col" className={thLeft}>
                    HSN/SAC
                  </th>
                  <th scope="col" className={cn(thLeft, "min-w-[6.5rem]")}>
                    Stock batch
                  </th>
                  <th scope="col" className={cn(thRight, "w-[4.25rem]")}>
                    Qty
                  </th>
                  <th scope="col" className={thRight}>
                    {isPurchaseCostLine ? "Purchase ₹" : "Unit price"}
                  </th>
                  {isPurchaseCostLine ? (
                    <th scope="col" className={thRight}>
                      Selling ₹
                    </th>
                  ) : null}
                  <th scope="col" className={cn(thRight, "min-w-[5.5rem]")}>
                    Discount %
                  </th>
                  <th scope="col" className={cn(thRight, "min-w-[5.5rem]")}>
                    Discount ₹
                  </th>
                  <th scope="col" className={thRight}>
                    Taxable
                  </th>
                  <th scope="col" className={thRight}>
                    Tax
                  </th>
                  <th scope="col" className={thRight}>
                    Net
                  </th>
                  <th scope="col" className={cn(thCenter, "w-[5.5rem] pr-4")}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {addedLines.map((line) => {
                  const totals = getLineAmounts(line);
                  const lineEntry = stockEntries.find((entry) => entry.id === line.stockEntryId);
                  const lineIssue = stockLineIssues[line.id];
                  const purchaseReturnOver = isPurchaseReturn && isReturnQuantityOverCap(line);
                  const purchaseCap = getReturnQuantityCap(line);
                  return (
                    <tr
                      key={line.id}
                      id={`added-line-${line.id}`}
                      tabIndex={-1}
                      className={cn(
                        "border-b outline-none last:border-0 hover:bg-muted/20",
                        lineIssue && "bg-amber-50/60",
                        purchaseReturnOver && "bg-destructive/[0.06]",
                        focusedIssueLineId === line.id && "ring-2 ring-amber-300",
                      )}
                    >
                      <td className="px-3 py-2.5 pl-4">
                        <div>{line.itemName.trim() || line.item?.name?.trim() || "—"}</div>
                        {lineIssue && (
                          <div className="mt-1 inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                            {lineIssue.message}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {line.hsnCode.trim()
                          ? line.hsnCode
                          : line.sacCode.trim()
                            ? line.sacCode
                            : line.item?.hsnCode?.trim()
                              ? line.item.hsnCode
                              : line.item?.sacCode?.trim()
                                ? line.item.sacCode
                                : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {lineEntry
                          ? formatISODateDisplay(getEntryDateIso(lineEntry)) || "No date"
                          : "-"}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right tabular-nums text-foreground",
                          purchaseReturnOver && "text-destructive",
                        )}
                      >
                        <div>{line.quantity}</div>
                        {purchaseReturnOver && purchaseCap != null ? (
                          <div className="mt-0.5 text-[11px] font-normal leading-tight text-destructive">
                            Max {purchaseCap}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      {isPurchaseCostLine ? (
                        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                          {line.sellingPrice?.trim() ? formatCurrency(line.sellingPrice) : "—"}
                        </td>
                      ) : null}
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {line.discountPercent.trim() === "" ? "0" : line.discountPercent}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatCurrency(
                          line.discountAmount.trim() === "" ? "0" : line.discountAmount,
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatCurrency(totals.taxable)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatCurrency(totals.tax)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                        {formatCurrency(totals.total)}
                      </td>
                      <td className="px-3 py-2.5 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {lineIssue && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => applySuggestedQtyForLine(line.id)}
                            >
                              Fix qty
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeAddedLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/40 font-semibold text-foreground">
                  <td
                    colSpan={isPurchaseCostLine ? 7 : 6}
                    className="whitespace-nowrap px-3 py-2.5 pl-4 text-left"
                  >
                    Total
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(addedLinesTotals.lineDiscount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(addedLinesTotals.taxable)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatCurrency(addedLinesTotals.tax)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    {formatCurrency(addedLinesTotals.net)}
                  </td>
                  <td className="px-3 py-2.5 pr-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
