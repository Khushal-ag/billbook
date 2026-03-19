"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInvoiceTypeCreateCopy } from "@/lib/invoice";
import { getEntryDateIso, getLineAmounts } from "@/lib/invoice-create";
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
  addCurrentLine: () => Promise<void>;
  removeAddedLine: (lineId: string) => void;
  applySuggestedQtyForLine: (lineId: string) => void;
  stockLineIssues: Record<string, StockLineIssue>;
  focusedIssueLineId: string | null;
  qtyAutoAdjusted: boolean;
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
  addCurrentLine,
  removeAddedLine,
  applySuggestedQtyForLine,
  stockLineIssues,
  focusedIssueLineId,
  qtyAutoAdjusted,
}: LineEditorSectionProps) {
  const copy = getInvoiceTypeCreateCopy(invoiceType);

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
        <div className="grid gap-3 rounded-lg border p-3 xl:grid-cols-[2.2fr_.7fr_1fr_.9fr_.9fr_1fr_1fr_1fr_.8fr] xl:items-end">
          <div>
            <Label className={draftLabelClass}>
              {copy.batchLabel} <span className="text-destructive">*</span>
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
            <Input value={draftLine.unitPrice} disabled className="text-right tabular-nums" />
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
            <Label className={draftLabelClass}>Taxable amount</Label>
            <Input
              value={formatCurrency(getLineAmounts(draftLine).taxable)}
              disabled
              className="text-right"
            />
          </div>

          <div>
            <Label className={draftLabelClass}>Tax amount</Label>
            <Input
              value={formatCurrency(getLineAmounts(draftLine).tax)}
              disabled
              className="text-right"
            />
          </div>

          <div>
            <Label className={draftLabelClass}>Net amount</Label>
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

        {addedLines.length > 0 && (
          <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[1000px] text-sm" aria-label="Added invoice items">
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
                    Unit price
                  </th>
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
                  return (
                    <tr
                      key={line.id}
                      id={`added-line-${line.id}`}
                      tabIndex={-1}
                      className={cn(
                        "border-b outline-none last:border-0 hover:bg-muted/20",
                        lineIssue && "bg-amber-50/60",
                        focusedIssueLineId === line.id && "ring-2 ring-amber-300",
                      )}
                    >
                      <td className="px-3 py-2.5 pl-4">
                        <div>{line.item?.name ?? "-"}</div>
                        {lineIssue && (
                          <div className="mt-1 inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                            {lineIssue.message}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {line.item?.hsnCode?.trim()
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
                      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatCurrency(line.unitPrice)}
                      </td>
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
                  <td colSpan={6} className="whitespace-nowrap px-3 py-2.5 pl-4 text-left">
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
