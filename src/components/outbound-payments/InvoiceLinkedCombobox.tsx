"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/core/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useInvoices } from "@/hooks/use-invoices";
import type { Invoice, InvoiceType } from "@/types/invoice";

const NONE_VALUE = "__invoice_none__" as const;

export interface InvoiceLinkedComboboxProps {
  invoiceType: Extract<InvoiceType, "PURCHASE_INVOICE" | "SALE_RETURN">;
  /** Required when linking purchase bills to a supplier */
  partyId?: number;
  valueId: string;
  onValueIdChange: (id: string) => void;
  /** Shown as the first row; clears `valueId` when chosen */
  noneOptionLabel?: string;
  formatOption: (inv: Invoice) => string;
  /** Shown when closed and an invoice is selected (from parent `useInvoice`, etc.) */
  displayLabel?: string | null;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  inputId?: string;
  /** Raise above dialogs (e.g. z-50) */
  inDialog?: boolean;
}

export function InvoiceLinkedCombobox({
  invoiceType,
  partyId,
  valueId,
  onValueIdChange,
  noneOptionLabel,
  formatOption,
  displayLabel,
  placeholder,
  disabled,
  className,
  inputId,
  inDialog = false,
}: InvoiceLinkedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  /** User chose "On account" / none row — show as selected when `valueId` is empty. */
  const [explicitNoneSelected, setExplicitNoneSelected] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue.trim(), 300);
  const queryEnabled =
    open &&
    (invoiceType === "SALE_RETURN" ||
      (invoiceType === "PURCHASE_INVOICE" && partyId != null && Number.isFinite(partyId)));

  const { data, isFetching, isPending } = useInvoices({
    page: 1,
    pageSize: 100,
    invoiceType,
    status: "FINAL",
    partyId: invoiceType === "PURCHASE_INVOICE" ? partyId : undefined,
    search: debouncedSearch || undefined,
    enabled: queryEnabled,
    keepPreviousWhileFetching: true,
  });

  const rows = useMemo(() => data?.invoices ?? [], [data?.invoices]);

  const typingAhead =
    open && inputValue.trim() !== debouncedSearch.trim() && inputValue.trim() !== "";

  const committedLabel = displayLabel?.trim() ?? "";

  useEffect(() => {
    if (valueId) setExplicitNoneSelected(false);
  }, [valueId]);

  useEffect(() => {
    if (!open && valueId && committedLabel) setInputValue(committedLabel);
    if (!open && !valueId && !explicitNoneSelected) setInputValue("");
  }, [open, valueId, committedLabel, explicitNoneSelected]);

  useEffect(() => {
    if (open) {
      const len = (noneOptionLabel ? 1 : 0) + rows.length;
      setHighlightedIndex(len > 0 ? 0 : -1);
    }
  }, [open, noneOptionLabel, rows.length, debouncedSearch]);

  useEffect(() => {
    if (!open || highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-highlight-index="${highlightedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const noneCount = noneOptionLabel ? 1 : 0;
  const optionsLength = noneCount + rows.length;

  const handleSelectNone = () => {
    setExplicitNoneSelected(true);
    onValueIdChange("");
    setOpen(false);
    setInputValue("");
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setExplicitNoneSelected(false);
    onValueIdChange(String(inv.id));
    setOpen(false);
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (explicitNoneSelected) setExplicitNoneSelected(false);
    if (valueId && committedLabel && v !== committedLabel) onValueIdChange("");
    else if (valueId && !committedLabel && v.trim() !== "") onValueIdChange("");
    setInputValue(v);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      if (valueId && committedLabel) setInputValue(committedLabel);
      else if (explicitNoneSelected && noneOptionLabel) setInputValue("");
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
      if (noneOptionLabel && highlightedIndex === 0) {
        handleSelectNone();
        return;
      }
      const rowIndex = highlightedIndex - noneCount;
      if (rows[rowIndex]) handleSelectInvoice(rows[rowIndex]);
    }
  };

  const onAccountClosed = Boolean(noneOptionLabel) && !valueId && explicitNoneSelected && !open;
  const closedFieldValue = onAccountClosed
    ? noneOptionLabel!
    : !open && valueId && committedLabel
      ? committedLabel
      : !open && valueId && !committedLabel
        ? "Loading…"
        : inputValue;

  const listLoading = isPending || isFetching || typingAhead;

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverAnchor asChild>
          <div className="block w-full cursor-text">
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              value={open ? inputValue : closedFieldValue}
              onChange={handleInputChange}
              onFocus={() => {
                setOpen(true);
                if (valueId && committedLabel) setInputValue(committedLabel);
                else setInputValue("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn("w-full font-normal", onAccountClosed && "font-medium")}
              autoComplete="off"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className={cn(
            "w-[min(28rem,calc(100vw-1rem))] min-w-[var(--radix-popover-trigger-width)] p-0",
            inDialog && "z-[200]",
          )}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {listLoading && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              {typingAhead ? "Searching…" : "Loading invoices…"}
            </div>
          )}
          <Command
            shouldFilter={false}
            value={
              noneOptionLabel && highlightedIndex === 0
                ? NONE_VALUE
                : (() => {
                    const row = rows[highlightedIndex - noneCount];
                    return row ? String(row.id) : "__none__";
                  })()
            }
          >
            <CommandList ref={listRef} className="max-h-72">
              <CommandEmpty className="flex flex-col items-center justify-center gap-2 px-4 py-8">
                <FileText className="h-9 w-9 text-muted-foreground/60" />
                <p className="text-center text-sm font-medium text-foreground">
                  {listLoading && rows.length === 0
                    ? "Loading invoices…"
                    : debouncedSearch
                      ? "No matching invoices"
                      : "No invoices to show"}
                </p>
                {invoiceType === "PURCHASE_INVOICE" && debouncedSearch && !listLoading && (
                  <p className="text-center text-xs text-muted-foreground">
                    Try your purchase number or the vendor&apos;s bill number
                  </p>
                )}
                {invoiceType === "SALE_RETURN" && debouncedSearch && !listLoading && (
                  <p className="text-center text-xs text-muted-foreground">
                    Try return number or customer name
                  </p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {noneOptionLabel ? (
                  <CommandItem
                    value={NONE_VALUE}
                    onSelect={handleSelectNone}
                    data-highlight-index={0}
                    className="group cursor-pointer"
                  >
                    <span className="truncate text-muted-foreground group-data-[selected=true]:text-accent-foreground">
                      {noneOptionLabel}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        !valueId && explicitNoneSelected && (!open || highlightedIndex === 0)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ) : null}
                {rows.map((inv, i) => {
                  const index = noneCount + i;
                  const label = formatOption(inv);
                  return (
                    <CommandItem
                      key={inv.id}
                      value={String(inv.id)}
                      onSelect={() => handleSelectInvoice(inv)}
                      data-highlight-index={index}
                      className="group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 truncate text-left">{label}</div>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          valueId === String(inv.id)
                            ? "text-foreground opacity-100 group-data-[selected=true]:text-accent-foreground"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {!listLoading && rows.length === 0 ? (
                <div className="border-t px-3 py-2 text-center text-xs text-muted-foreground">
                  {debouncedSearch
                    ? "No invoices match — try another number or name"
                    : "No finalized invoices found for this search"}
                </div>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
