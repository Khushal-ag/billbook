"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatISODateDisplay } from "@/lib/core/date";
import { getEntryDateIso } from "@/lib/invoice/invoice-create";
import { cn, formatCurrency, formatStockQuantity } from "@/lib/core/utils";
import type { StockChoice } from "@/types/invoice-create";
import type { Item } from "@/types/item";

export type StockSearchPickerMode = "stockEntries" | "catalog";

interface StockSearchPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  /** Button label when not using `inputTrigger` (stock picker / catalog button mode). */
  triggerLabel?: React.ReactNode;
  /** Purchase catalog: text field as trigger — typing filters; popover lists matches (no duplicate search inside). */
  inputTrigger?: boolean;
  /** Narrower trigger (e.g. purchase line layout). */
  triggerClassName?: string;
  draftLineStockEntryId: number | null;
  filteredStockChoices: StockChoice[];
  itemsWithoutStockOptions: Item[];
  showAddItemOption: boolean;
  onSelectChoice: (lineId: string, choice: StockChoice) => void;
  onAddStockForItem: (item: Item) => void;
  onAddNewItem: () => void;
  draftLineId: string;
  /** Purchase invoice: list all catalog items instead of stock batches. */
  pickerMode?: StockSearchPickerMode;
  catalogItems?: Item[];
  onSelectCatalogItem?: (lineId: string, item: Item) => void;
  selectedCatalogItemId?: number | null;
}

export function StockSearchPopover({
  open,
  onOpenChange,
  searchText,
  onSearchChange,
  triggerLabel,
  inputTrigger = false,
  triggerClassName,
  draftLineStockEntryId,
  filteredStockChoices,
  itemsWithoutStockOptions,
  showAddItemOption,
  onSelectChoice,
  onAddStockForItem,
  onAddNewItem,
  draftLineId,
  pickerMode = "stockEntries",
  catalogItems = [],
  onSelectCatalogItem,
  selectedCatalogItemId = null,
}: StockSearchPopoverProps) {
  const catalogMode = pickerMode === "catalog";
  const useInputTrigger = Boolean(inputTrigger && catalogMode);

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      {useInputTrigger ? (
        <PopoverAnchor asChild>
          <div className="w-full min-w-0">
            <Input
              value={searchText}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onOpenChange(true);
              }}
              onFocus={() => onOpenChange(true)}
              placeholder="Search item by name…"
              className={cn(
                "h-8 w-full max-w-full truncate text-left text-sm font-normal",
                triggerClassName,
              )}
              autoComplete="off"
              aria-expanded={open}
              aria-controls="stock-search-command-list"
            />
          </div>
        </PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("h-8 w-full justify-start text-left font-normal", triggerClassName)}
          >
            {triggerLabel}
          </Button>
        </PopoverTrigger>
      )}
      <PopoverContent
        align="start"
        className="w-[min(38rem,calc(100vw-1rem))] p-0"
        onOpenAutoFocus={useInputTrigger ? (e) => e.preventDefault() : undefined}
      >
        <Command
          shouldFilter={false}
          className="[&_[cmdk-item]:hover]:!bg-muted/45 [&_[cmdk-item]:hover]:!text-foreground [&_[cmdk-item][data-selected=true]]:!bg-muted/55 [&_[cmdk-item][data-selected=true]]:!text-foreground [&_[cmdk-item]]:transition-colors"
        >
          {!useInputTrigger ? (
            <div className="border-b p-2">
              <Input
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  catalogMode ? "Search items by name…" : "Search by item, purchase date, or vendor"
                }
                className="h-8"
              />
            </div>
          ) : null}
          <CommandList id="stock-search-command-list" className="max-h-[360px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {catalogMode ? "No matching items." : "No matching stock entries found."}
            </CommandEmpty>
            <CommandGroup>
              {catalogMode
                ? catalogItems.map((item) => {
                    const isSelected = selectedCatalogItemId === item.id;
                    return (
                      <CommandItem
                        key={`catalog-${item.id}`}
                        value={`catalog-${item.id}-${item.name}`}
                        onSelect={() => onSelectCatalogItem?.(draftLineId, item)}
                        className="cursor-pointer items-start py-2 text-foreground"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {item.name}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.type === "SERVICE" ? "Service" : "Stock item"}
                            {item.hsnCode ? ` · HSN ${item.hsnCode}` : ""}
                            {item.sacCode ? ` · SAC ${item.sacCode}` : ""}
                          </div>
                        </div>
                        {isSelected && <span className="ml-2 text-xs text-primary">Selected</span>}
                      </CommandItem>
                    );
                  })
                : null}
              {!catalogMode
                ? filteredStockChoices.map((choice) => {
                    const dateText = formatISODateDisplay(getEntryDateIso(choice.entry));
                    const isSelected = draftLineStockEntryId === choice.entry.id;
                    const statusText = choice.enabledForSelection
                      ? choice.item.type === "SERVICE"
                        ? "Service item"
                        : `Available ${formatStockQuantity(choice.remainingQty)}`
                      : choice.remainingQty <= 0
                        ? "Used up"
                        : "Locked until older batch is used";

                    return (
                      <CommandItem
                        key={choice.entry.id}
                        value={`${choice.item.name}-${choice.entry.id}`}
                        onSelect={() => onSelectChoice(draftLineId, choice)}
                        className={cn(
                          "items-start py-2",
                          choice.enabledForSelection
                            ? "cursor-pointer text-foreground"
                            : "cursor-not-allowed bg-muted/30 text-muted-foreground",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "truncate text-sm",
                              choice.enabledForSelection
                                ? "font-medium text-foreground"
                                : "font-normal text-muted-foreground",
                            )}
                          >
                            {choice.item.name}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-xs",
                              choice.enabledForSelection
                                ? "text-muted-foreground"
                                : "text-muted-foreground/80",
                            )}
                          >
                            Batch: {dateText || "No date"} | Price:{" "}
                            {formatCurrency(choice.entry.sellingPrice)}
                            {choice.item.hsnCode ? ` | HSN: ${choice.item.hsnCode}` : ""}
                            {choice.item.type === "STOCK"
                              ? ` | Remaining: ${formatStockQuantity(choice.remainingQty)}`
                              : ""}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 text-[11px]",
                              choice.enabledForSelection
                                ? "text-emerald-600"
                                : "text-muted-foreground/90",
                            )}
                          >
                            {statusText}
                          </div>
                        </div>
                        {isSelected && <span className="ml-2 text-xs text-primary">Selected</span>}
                      </CommandItem>
                    );
                  })
                : null}

              {!catalogMode
                ? itemsWithoutStockOptions.map((item) => (
                    <CommandItem
                      key={`no-stock-${item.id}`}
                      value={`no-stock-${item.id}-${item.name}`}
                      onSelect={() => onAddStockForItem(item)}
                      className="items-start py-2 text-foreground"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.name}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          No stock available for this item.
                        </div>
                        <div className="mt-0.5 text-[11px] text-primary">
                          Add stock for this item
                        </div>
                      </div>
                    </CommandItem>
                  ))
                : null}

              {showAddItemOption && (
                <CommandItem
                  value={`add-item-${searchText.trim().toLowerCase()}`}
                  onSelect={onAddNewItem}
                  className="items-start py-2 text-foreground"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      Add new item &quot;{searchText.trim()}&quot;
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      Item not found. Create it and then add stock.
                    </div>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
