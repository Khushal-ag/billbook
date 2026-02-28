"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Plus, Users } from "lucide-react";
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
import type { Party } from "@/types/party";

interface VendorAutocompleteProps {
  value: Party | null;
  onValueChange: (vendor: Party | null) => void;
  suppliers: Party[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
  /** When provided, shows "Add vendor" option; called with callback to select the newly created party */
  onAddVendor?: (onCreated: (party: Party) => void) => void;
}

const NONE_VALUE = "__none__";
const ADD_VENDOR_VALUE = "__add_vendor__";

export function VendorAutocomplete({
  value,
  onValueChange,
  suppliers,
  placeholder = "Type to search vendor...",
  className,
  disabled,
  compact,
  onAddVendor,
}: VendorAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = suppliers
    .filter((s) => {
      const q = inputValue.trim().toLowerCase();
      if (!q) return true;
      return s.name.toLowerCase().includes(q);
    })
    .slice(0, 50);

  // None + filtered list + optional "Add vendor"; index 0 = None, 1..n = suppliers, n+1 = Add vendor
  const addVendorIndex = onAddVendor ? 1 + filtered.length : -1;
  const options: (Party | null | typeof ADD_VENDOR_VALUE)[] = [
    null,
    ...filtered,
    ...(onAddVendor ? [ADD_VENDOR_VALUE] : []),
  ];
  const highlightedOption = options[highlightedIndex] ?? null;

  const displayValue = open ? inputValue : value ? value.name : inputValue;

  useEffect(() => {
    if (!open && value) setInputValue(value.name);
    if (!open && !value) setInputValue("");
  }, [open, value]);

  useEffect(() => {
    if (open) setHighlightedIndex(0);
  }, [open, inputValue]);

  useEffect(() => {
    if (!open || highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-highlight-index="${highlightedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleSelect = (party: Party | null) => {
    onValueChange(party);
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
      setHighlightedIndex((i) => (i < options.length - 1 ? i + 1 : i));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedOption === ADD_VENDOR_VALUE && onAddVendor) {
        onAddVendor((party) => {
          onValueChange(party);
          setOpen(false);
        });
        return;
      }
      handleSelect(highlightedOption as Party | null);
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
            aria-controls={open ? "vendor-listbox" : undefined}
            aria-activedescendant={
              open
                ? highlightedOption === null
                  ? "vendor-none"
                  : highlightedOption === ADD_VENDOR_VALUE
                    ? "vendor-add"
                    : `vendor-${(highlightedOption as Party).id}`
                : undefined
            }
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        id="vendor-listbox"
        role="listbox"
        className={cn("w-[var(--radix-popover-trigger-width)] p-0", compact && "max-h-56")}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          value={highlightedOption === null ? NONE_VALUE : String(highlightedOption.id)}
        >
          <CommandList ref={listRef}>
            <CommandEmpty className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <Users className="h-9 w-9 text-muted-foreground/60" />
              <p className="text-center text-sm font-medium text-foreground">
                {inputValue.trim() ? "No matching vendor" : "Type to search"}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {inputValue.trim()
                  ? "Add the supplier from Parties, then try again."
                  : "Start typing to filter the list."}
              </p>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={NONE_VALUE}
                onSelect={() => handleSelect(null)}
                data-highlight-index={0}
                id={open ? "vendor-none" : undefined}
                className="group cursor-pointer data-[selected=true]:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    !value ? "text-accent-foreground opacity-100" : "opacity-0",
                  )}
                />
                <span className="text-muted-foreground group-data-[selected=true]:text-accent-foreground">
                  None
                </span>
              </CommandItem>
              {filtered.map((s, index) => (
                <CommandItem
                  key={s.id}
                  value={String(s.id)}
                  onSelect={() => handleSelect(s)}
                  data-highlight-index={index + 1}
                  id={open ? `vendor-${s.id}` : undefined}
                  className="group cursor-pointer data-[selected=true]:text-accent-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value?.id === s.id ? "text-accent-foreground opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate group-data-[selected=true]:text-accent-foreground">
                    {s.name}
                  </span>
                </CommandItem>
              ))}
              {onAddVendor && (
                <CommandItem
                  value={ADD_VENDOR_VALUE}
                  onSelect={() => {
                    onAddVendor((party) => {
                      onValueChange(party);
                      setOpen(false);
                    });
                  }}
                  data-highlight-index={addVendorIndex}
                  id={open ? "vendor-add" : undefined}
                  className="group mt-1 cursor-pointer border-t border-border pt-1 data-[selected=true]:text-accent-foreground"
                >
                  <Plus className="mr-2 h-4 w-4 shrink-0 text-muted-foreground group-data-[selected=true]:text-accent-foreground" />
                  <span className="text-muted-foreground group-data-[selected=true]:text-accent-foreground">
                    Add vendor
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
