"use client";

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
  updateLine: (lineId: string, patch: Partial<InvoiceLineDraft>) => void;
  onLineDiscountChange: (lineId: string, value: string) => void;
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
  updateLine,
  onLineDiscountChange,
  addCurrentLine,
  removeAddedLine,
  applySuggestedQtyForLine,
  stockLineIssues,
  focusedIssueLineId,
  qtyAutoAdjusted,
}: LineEditorSectionProps) {
  const copy = getInvoiceTypeCreateCopy(invoiceType);
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
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{copy.itemSectionTitle}</CardTitle>
        {copy.itemSectionHelper && (
          <p className="mt-1 text-xs font-normal text-muted-foreground">{copy.itemSectionHelper}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 rounded-lg border p-3 xl:grid-cols-[2.2fr_.7fr_1fr_.9fr_1fr_1fr_1fr_.8fr] xl:items-end">
          <div>
            <Label className="mb-1.5 block text-xs">{copy.batchLabel} *</Label>
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
            <Label className="mb-1.5 block text-xs">Qty</Label>
            <Input
              value={draftLine.quantity}
              onChange={(e) => updateLine(draftLine.id, { quantity: e.target.value })}
              className={cn(
                "text-right tabular-nums transition-colors",
                qtyAutoAdjusted &&
                  "animate-pulse bg-amber-50 ring-2 ring-amber-300 focus-visible:ring-amber-400",
              )}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Unit Price</Label>
            <Input value={draftLine.unitPrice} disabled className="text-right tabular-nums" />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Item Discount %</Label>
            <Input
              value={draftLine.discountPercent}
              onChange={(e) => onLineDiscountChange(draftLine.id, e.target.value)}
              placeholder="0"
              className="text-right tabular-nums"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Taxable Amount</Label>
            <Input
              value={formatCurrency(getLineAmounts(draftLine).taxable)}
              disabled
              className="text-right"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Tax Amount</Label>
            <Input
              value={formatCurrency(getLineAmounts(draftLine).tax)}
              disabled
              className="text-right"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Net Amount</Label>
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
            <table className="w-full min-w-[960px] text-sm" aria-label="Added invoice items">
              <thead>
                <tr className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">HSN</th>
                  <th className="px-3 py-2 text-left">Stock Batch</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Item Discount %</th>
                  <th className="px-3 py-2 text-right">Taxable Amount</th>
                  <th className="px-3 py-2 text-right">Tax Amount</th>
                  <th className="px-3 py-2 text-right">Net Amount</th>
                  <th className="px-3 py-2 text-center">Action</th>
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
                      <td className="px-3 py-2.5">
                        <div>{line.item?.name ?? "-"}</div>
                        {lineIssue && (
                          <div className="mt-1 inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                            {lineIssue.message}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {line.item?.hsnCode ?? "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        {lineEntry
                          ? formatISODateDisplay(getEntryDateIso(lineEntry)) || "No date"
                          : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{line.quantity}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {line.discountPercent.trim() === "" ? "0" : line.discountPercent}
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
                      <td className="px-3 py-2.5 text-center">
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
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
