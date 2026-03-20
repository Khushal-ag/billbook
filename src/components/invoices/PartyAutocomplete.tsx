"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useParties } from "@/hooks/use-parties";
import type { Party, PartyType } from "@/types/party";

interface PartyAutocompleteProps {
  value: Party | null;
  onValueChange: (party: Party | null) => void;
  /** Used only when serverSearch is false (client-side filter). */
  parties?: Party[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onAddParty?: (onCreated: (party: Party) => void, draftName?: string) => void;
  addLabel?: string;
  /** Stack popover above Radix Dialog (z-50) so the list is visible and clickable. */
  inDialog?: boolean;
  /** Focus input on mount (e.g. when parent dialog opens). */
  autoFocus?: boolean;
  /**
   * When true, loads parties via GET /parties?search=… (debounced) while the dropdown is open.
   * Matches name, phone, email, GSTIN, etc.
   */
  serverSearch?: boolean;
  /** Narrows GET /parties when serverSearch is on. */
  partiesQueryType?: PartyType;
}

const ADD_PARTY_VALUE = "__add_party__" as const;

function formatPartyAddress(party: Party): string {
  const parts = [party.address?.trim(), party.city?.trim()].filter((part): part is string =>
    Boolean(part),
  );
  return parts.join(", ");
}

export function PartyAutocomplete({
  value,
  onValueChange,
  parties: partiesProp = [],
  placeholder = "Search party...",
  className,
  disabled,
  onAddParty,
  addLabel = "Add party",
  inDialog = false,
  autoFocus = false,
  serverSearch = false,
  partiesQueryType,
}: PartyAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue.trim(), 300);

  const { data: searchData, isFetching } = useParties(
    {
      type: partiesQueryType,
      includeInactive: false,
      search: debouncedSearch || undefined,
      limit: 100,
    },
    {
      enabled: serverSearch && open,
      keepPreviousData: true,
    },
  );

  const serverParties = useMemo(() => {
    const list = (searchData?.parties ?? []).filter((p) => p.isActive);
    if (value && !list.some((p) => p.id === value.id)) {
      return [value, ...list];
    }
    return list;
  }, [searchData, value]);

  const baseParties = serverSearch ? serverParties : partiesProp;

  const filtered = useMemo(() => {
    if (serverSearch) {
      return baseParties.slice(0, 100);
    }
    const q = inputValue.trim().toLowerCase();
    return baseParties
      .filter((party) => {
        if (!q) return true;
        return party.name.toLowerCase().includes(q);
      })
      .slice(0, 50);
  }, [serverSearch, baseParties, inputValue]);

  const trimmedInput = inputValue.trim();
  const hasExactMatch = useMemo(
    () =>
      Boolean(
        trimmedInput &&
        baseParties.some((party) => party.name.trim().toLowerCase() === trimmedInput.toLowerCase()),
      ),
    [baseParties, trimmedInput],
  );
  const showAdd = Boolean(onAddParty && trimmedInput && !hasExactMatch);

  const optionsLength = filtered.length + (showAdd ? 1 : 0);
  const addIndex = showAdd ? filtered.length : -1;

  const selectedAddress = value ? formatPartyAddress(value) : "";
  const selectedDisplayValue = value
    ? selectedAddress
      ? `${value.name} (${selectedAddress})`
      : value.name
    : "";
  const displayValue = open ? inputValue : value ? selectedDisplayValue : inputValue;

  const typingAhead =
    serverSearch &&
    open &&
    inputValue.trim() !== debouncedSearch.trim() &&
    inputValue.trim() !== "";

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

  const handleSelect = (party: Party) => {
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
      if (showAdd && highlightedIndex === addIndex && onAddParty) {
        onAddParty((party) => {
          onValueChange(party);
          setOpen(false);
        }, trimmedInput);
        return;
      }
      if (filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex]);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className="block w-full cursor-text">
          <Input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => {
              setOpen(true);
              setInputValue(value ? value.name : "");
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("w-full font-normal", className)}
            autoComplete="off"
            autoFocus={autoFocus}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className={cn(
          "w-[min(24rem,calc(100vw-1rem))] min-w-[var(--radix-popover-trigger-width)] p-0",
          inDialog && "z-[200]",
        )}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {serverSearch && (isFetching || typingAhead) && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            {typingAhead ? "Searching…" : "Loading parties…"}
          </div>
        )}
        <Command
          shouldFilter={false}
          value={
            showAdd && highlightedIndex === addIndex
              ? ADD_PARTY_VALUE
              : filtered[highlightedIndex]
                ? String(filtered[highlightedIndex].id)
                : "__none__"
          }
        >
          <CommandList ref={listRef}>
            <CommandEmpty className="flex flex-col items-center justify-center gap-2 px-4 py-8">
              <Users className="h-9 w-9 text-muted-foreground/60" />
              <p className="text-center text-sm font-medium text-foreground">
                {serverSearch && isFetching && filtered.length === 0
                  ? "Loading parties…"
                  : inputValue.trim()
                    ? "No matching party"
                    : "Type to search"}
              </p>
              {serverSearch &&
                !isFetching &&
                !typingAhead &&
                inputValue.trim() &&
                filtered.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Try phone, GSTIN, or part of the name
                  </p>
                )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((party, index) => (
                <CommandItem
                  key={party.id}
                  value={String(party.id)}
                  onSelect={() => handleSelect(party)}
                  data-highlight-index={index}
                  className="group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{party.name}</div>
                    {formatPartyAddress(party) && (
                      <div className="truncate text-xs text-foreground/70 group-data-[selected=true]:text-accent-foreground/95">
                        {formatPartyAddress(party)}
                      </div>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value?.id === party.id
                        ? "text-foreground opacity-100 group-data-[selected=true]:text-accent-foreground"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
              {showAdd && (
                <CommandItem
                  value={ADD_PARTY_VALUE}
                  onSelect={() => {
                    onAddParty?.((party) => {
                      onValueChange(party);
                      setOpen(false);
                    }, trimmedInput);
                  }}
                  data-highlight-index={addIndex}
                  className="group mt-1 cursor-pointer border-t border-border pt-1"
                >
                  <Plus className="mr-2 h-4 w-4 text-muted-foreground group-data-[selected=true]:text-accent-foreground" />
                  <span className="truncate text-muted-foreground group-data-[selected=true]:text-accent-foreground">
                    {addLabel}
                    {trimmedInput ? ` "${trimmedInput}"` : ""}
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
