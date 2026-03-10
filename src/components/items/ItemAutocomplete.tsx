"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Check, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Item } from "@/types/item";
import { getItemCategoryDisplay } from "@/types/item";

interface ItemAutocompleteProps {
  value: Item | null;
  onValueChange: (item: Item | null) => void;
  items: Item[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Filter to STOCK only for stock entry */
  stockOnly?: boolean;
  /** Input is used inside a grid cell; compact styling */
  compact?: boolean;
  /** When provided, shows "Add item" option; called with callback to select the newly created item */
  onAddItem?: (onCreated: (item: Item) => void, draftName?: string) => void;
}

const ADD_ITEM_VALUE = "__add_item__" as const;

export function ItemAutocomplete({
  value,
  onValueChange,
  items,
  placeholder = "Type to search item...",
  className,
  disabled,
  stockOnly,
  compact,
  onAddItem,
}: ItemAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const categoryLabel = (item: Item) => {
    const d = getItemCategoryDisplay(item);
    return d === "—" ? "" : d;
  };
  const filtered = useMemo(
    () =>
      items
        .filter((item) => {
          if (stockOnly && item.type !== "STOCK") return false;
          if (!item.isActive) return false;
          const q = inputValue.trim().toLowerCase();
          if (!q) return true;
          return (
            item.name.toLowerCase().includes(q) || categoryLabel(item).toLowerCase().includes(q)
          );
        })
        .slice(0, 50),
    [items, stockOnly, inputValue],
  );
  const trimmedInput = inputValue.trim();
  const normalizedInput = trimmedInput.toLowerCase();
  const hasExactNameMatch = useMemo(
    () =>
      Boolean(
        normalizedInput &&
        items.some((item) => {
          if (stockOnly && item.type !== "STOCK") return false;
          if (!item.isActive) return false;
          return item.name.trim().toLowerCase() === normalizedInput;
        }),
      ),
    [items, stockOnly, normalizedInput],
  );
  const shouldShowAddItem = Boolean(onAddItem && trimmedInput && !hasExactNameMatch);
  const optionsLength = filtered.length + (shouldShowAddItem ? 1 : 0);
  const addItemIndex = shouldShowAddItem ? filtered.length : -1;

  const displayValue = open ? inputValue : value ? value.name : inputValue;

  useEffect(() => {
    if (!open && value) setInputValue(value.name);
    if (!open && !value) setInputValue("");
  }, [open, value]);

  useEffect(() => {
    if (open) setHighlightedIndex(optionsLength > 0 ? 0 : -1);
  }, [open, optionsLength, inputValue]);

  useEffect(() => {
    if (!open || highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-highlight-index="${highlightedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleSelect = (item: Item) => {
    onValueChange(item);
    setOpen(false);
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (value && v !== value.name) onValueChange(null);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      if (value) setInputValue(value.name);
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i < optionsLength - 1 ? i + 1 : i));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (shouldShowAddItem && highlightedIndex === addItemIndex && onAddItem) {
        onAddItem((item) => {
          onValueChange(item);
          setOpen(false);
        }, trimmedInput);
        return;
      }
      if (filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex]);
      }
    }
  };

  const stopTriggerEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div
          className="block w-full cursor-text"
          onFocus={(e) => {
            if (e.target !== inputRef.current) inputRef.current?.focus();
          }}
          onPointerDownCapture={(e) => {
            if (e.target === inputRef.current) e.stopPropagation();
          }}
          onClickCapture={(e) => {
            if (e.target === inputRef.current) e.stopPropagation();
          }}
        >
          <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => {
              setOpen(true);
              setInputValue(value ? value.name : "");
            }}
            onPointerDown={stopTriggerEvent}
            onClick={stopTriggerEvent}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("w-full font-normal", compact && "h-8 text-sm", className)}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={open ? "item-listbox" : undefined}
            aria-activedescendant={
              open && filtered[highlightedIndex]
                ? `item-${filtered[highlightedIndex].id}`
                : undefined
            }
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        id="item-listbox"
        role="listbox"
        className={cn(
          "w-[min(20rem,calc(100vw-1rem))] min-w-[var(--radix-popover-trigger-width)] p-0",
          compact && "max-h-56",
        )}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          value={
            shouldShowAddItem && highlightedIndex === addItemIndex
              ? ADD_ITEM_VALUE
              : filtered[highlightedIndex]
                ? String(filtered[highlightedIndex].id)
                : "__none__"
          }
        >
          <CommandList ref={listRef}>
            <CommandEmpty className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <Package className="h-9 w-9 text-muted-foreground/60" />
              <p className="text-center text-sm font-medium text-foreground">
                {inputValue.trim() ? "No matching item" : "Type to search"}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {inputValue.trim()
                  ? "Use Add item below to quickly create it."
                  : "Start typing to filter the list."}
              </p>
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((item, index) => (
                <CommandItem
                  key={item.id}
                  value={String(item.id)}
                  onSelect={() => handleSelect(item)}
                  data-highlight-index={index}
                  id={open ? `item-${item.id}` : undefined}
                  className="group cursor-pointer items-start gap-2 py-2 data-[selected=true]:text-accent-foreground"
                >
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground group-data-[selected=true]:text-accent-foreground/85">
                    <Package className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-5">{item.name}</p>
                    {categoryLabel(item) && (
                      <p className="truncate text-xs leading-4 text-muted-foreground group-data-[selected=true]:text-accent-foreground/85">
                        {categoryLabel(item)}
                      </p>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      value?.id === item.id
                        ? "text-foreground opacity-100 group-data-[selected=true]:text-accent-foreground"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
              {shouldShowAddItem && (
                <CommandItem
                  value={ADD_ITEM_VALUE}
                  onSelect={() => {
                    onAddItem?.((item) => {
                      onValueChange(item);
                      setOpen(false);
                    }, trimmedInput);
                  }}
                  data-highlight-index={addItemIndex}
                  id={open ? "item-add" : undefined}
                  className="group mt-1 cursor-pointer border-t border-border pt-1 data-[selected=true]:text-accent-foreground"
                >
                  <Plus className="mr-2 h-4 w-4 shrink-0 text-muted-foreground group-data-[selected=true]:text-accent-foreground" />
                  <span className="truncate text-muted-foreground group-data-[selected=true]:text-accent-foreground">
                    Add item{trimmedInput ? ` "${trimmedInput}"` : ""}
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
