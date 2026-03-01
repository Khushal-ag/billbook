"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Package } from "lucide-react";
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
}

export function ItemAutocomplete({
  value,
  onValueChange,
  items,
  placeholder = "Type to search item...",
  className,
  disabled,
  stockOnly,
  compact,
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
  const filtered = items
    .filter((item) => {
      if (stockOnly && item.type !== "STOCK") return false;
      if (item.deletedAt) return false;
      const q = inputValue.trim().toLowerCase();
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || categoryLabel(item).toLowerCase().includes(q);
    })
    .slice(0, 50);

  const displayValue = open ? inputValue : value ? value.name : inputValue;

  useEffect(() => {
    if (!open && value) setInputValue(value.name);
    if (!open && !value) setInputValue("");
  }, [open, value]);

  useEffect(() => {
    if (open) setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [open, filtered.length, inputValue]);

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
      setHighlightedIndex((i) => (i < filtered.length - 1 ? i + 1 : i));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
      return;
    }
    if (e.key === "Enter" && filtered[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filtered[highlightedIndex]);
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
        className={cn("w-[var(--radix-popover-trigger-width)] p-0", compact && "max-h-56")}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          value={filtered[highlightedIndex] ? String(filtered[highlightedIndex].id) : "__none__"}
        >
          <CommandList ref={listRef}>
            <CommandEmpty className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <Package className="h-9 w-9 text-muted-foreground/60" />
              <p className="text-center text-sm font-medium text-foreground">
                {inputValue.trim() ? "No matching item" : "Type to search"}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {inputValue.trim()
                  ? "Add the item from Items, then try again."
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
                  className="group cursor-pointer data-[selected=true]:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value?.id === item.id ? "text-accent-foreground opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  {categoryLabel(item) && (
                    <span className="ml-2 truncate text-xs text-muted-foreground group-data-[selected=true]:text-accent-foreground">
                      ({categoryLabel(item)})
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
