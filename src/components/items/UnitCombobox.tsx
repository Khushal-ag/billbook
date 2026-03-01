"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Unit, ItemType } from "@/types/item";

interface UnitComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  units: Unit[];
  unitsLoading?: boolean;
  type: ItemType;
  onCreateUnit?: (value: string, label: string, type: ItemType) => Promise<Unit | null>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function slugifyValue(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 50) || "unit"
  );
}

export function UnitCombobox({
  value,
  onValueChange,
  units,
  unitsLoading,
  type,
  onCreateUnit,
  placeholder = "Search or add unit...",
  className,
  disabled,
}: UnitComboboxProps) {
  const [open, setOpen] = useState(false);
  const [createInput, setCreateInput] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedUnit = value ? (units.find((u) => u.value === value) ?? null) : null;

  const handleSelect = (unit: Unit) => {
    onValueChange(unit.value);
    setOpen(false);
  };

  const handleCreate = async () => {
    const label = createInput.trim();
    if (!label || !onCreateUnit) return;
    const valueSlug = slugifyValue(label);
    setCreating(true);
    try {
      const created = await onCreateUnit(valueSlug, label, type);
      if (created) {
        onValueChange(created.value);
        setCreateInput("");
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const searchLower = createInput.trim().toLowerCase();
  const filtered = units.filter(
    (u) =>
      !searchLower ||
      u.label.toLowerCase().includes(searchLower) ||
      u.value.toLowerCase().includes(searchLower),
  );
  const showCreate = createInput.trim().length > 0 && onCreateUnit;
  const createName = createInput.trim();
  const hasUnits = units.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || unitsLoading}
          className={cn(
            "min-h-9 w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedUnit ? (
              <>
                <Ruler className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedUnit.label}</span>
              </>
            ) : value ? (
              value
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] rounded-lg border p-0 shadow-lg"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false} className="rounded-lg">
          <CommandInput
            placeholder="Search or type to add..."
            value={createInput}
            onValueChange={setCreateInput}
            className="h-10"
          />
          {/* Wrapper div is the scroll container; stopPropagation so trackpad/wheel scroll works (Radix/cmdk can capture wheel otherwise). */}
          <div
            className="max-h-[280px] touch-pan-y overflow-x-hidden overflow-y-scroll overscroll-contain py-1"
            style={{ WebkitOverflowScrolling: "touch" }}
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                {showCreate ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    <Plus className="h-4 w-4" />
                    {creating ? "Adding…" : `Add "${createName}"`}
                  </button>
                ) : (
                  <span>No unit found. Type a name and add one.</span>
                )}
              </CommandEmpty>
              {hasUnits && filtered.length > 0 && (
                <CommandGroup className="p-0">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Units
                  </div>
                  {filtered.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={`${u.id}-${u.value}`}
                      onSelect={() => handleSelect(u)}
                      className="flex cursor-pointer items-center gap-2 py-2.5"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          selectedUnit?.id === u.id
                            ? "border-primary bg-primary/10"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {selectedUnit?.id === u.id && (
                          <Check className="h-2.5 w-2.5 text-primary" />
                        )}
                      </span>
                      <span className={cn("truncate", selectedUnit?.id === u.id && "font-medium")}>
                        {u.label}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {showCreate && (
                <CommandGroup className="mt-1 border-t p-0 pt-1">
                  <CommandItem
                    onSelect={handleCreate}
                    disabled={creating}
                    className="flex cursor-pointer items-center gap-2 bg-muted/30 py-2.5 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>{creating ? "Adding…" : `Add "${createName}"`}</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
