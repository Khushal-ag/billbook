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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatISODateDisplay } from "@/lib/date";
import { getEntryDateIso } from "@/lib/invoice-create";
import { cn, formatCurrency } from "@/lib/utils";
import type { StockChoice } from "@/types/invoice-create";
import type { Item } from "@/types/item";

interface StockSearchPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  triggerLabel: React.ReactNode;
  draftLineStockEntryId: number | null;
  filteredStockChoices: StockChoice[];
  itemsWithoutStockOptions: Item[];
  showAddItemOption: boolean;
  onSelectChoice: (lineId: string, choice: StockChoice) => void;
  onAddStockForItem: (item: Item) => void;
  onAddNewItem: () => void;
  draftLineId: string;
}

export function StockSearchPopover({
  open,
  onOpenChange,
  searchText,
  onSearchChange,
  triggerLabel,
  draftLineStockEntryId,
  filteredStockChoices,
  itemsWithoutStockOptions,
  showAddItemOption,
  onSelectChoice,
  onAddStockForItem,
  onAddNewItem,
  draftLineId,
}: StockSearchPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-start text-left font-normal"
        >
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(38rem,calc(100vw-1rem))] p-0">
        <Command shouldFilter={false}>
          <div className="border-b p-2">
            <Input
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by item, purchase date, or vendor"
              className="h-8"
            />
          </div>
          <CommandList className="max-h-[360px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              No matching stock entries found.
            </CommandEmpty>
            <CommandGroup>
              {filteredStockChoices.map((choice) => {
                const dateText = formatISODateDisplay(getEntryDateIso(choice.entry));
                const isSelected = draftLineStockEntryId === choice.entry.id;
                const statusText = choice.enabledForSelection
                  ? choice.item.type === "SERVICE"
                    ? "Service item"
                    : `Available ${choice.remainingQty}`
                  : choice.remainingQty <= 0
                    ? "Used up"
                    : "Locked until older batch is used";

                return (
                  <CommandItem
                    key={choice.entry.id}
                    value={`${choice.item.name}-${choice.entry.id}`}
                    onSelect={() => onSelectChoice(draftLineId, choice)}
                    className={cn(
                      "items-start py-2 transition-colors",
                      choice.enabledForSelection
                        ? "cursor-pointer text-foreground hover:bg-muted/50 data-[selected=true]:bg-primary/15 data-[selected=true]:text-foreground"
                        : "cursor-not-allowed bg-muted/30 text-muted-foreground hover:bg-muted/50 data-[selected=true]:bg-muted/50 data-[selected=true]:text-muted-foreground",
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
                        {choice.item.type === "STOCK" ? ` | Remaining: ${choice.remainingQty}` : ""}
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
              })}

              {itemsWithoutStockOptions.map((item) => (
                <CommandItem
                  key={`no-stock-${item.id}`}
                  value={`no-stock-${item.id}-${item.name}`}
                  onSelect={() => onAddStockForItem(item)}
                  className="items-start py-2 text-foreground transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      No stock available for this item.
                    </div>
                    <div className="mt-0.5 text-[11px] text-primary">Add stock for this item</div>
                  </div>
                </CommandItem>
              ))}

              {showAddItemOption && (
                <CommandItem
                  value={`add-item-${searchText.trim().toLowerCase()}`}
                  onSelect={onAddNewItem}
                  className="items-start py-2 text-foreground transition-colors hover:bg-muted/50"
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
