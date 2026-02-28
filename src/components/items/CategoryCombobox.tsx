"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Tag } from "lucide-react";
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
import type { Category } from "@/types/item";

interface CategoryComboboxProps {
  value: Category | null;
  onValueChange: (cat: Category | null) => void;
  categories: Category[];
  categoriesLoading?: boolean;
  onCreateCategory?: (name: string) => Promise<Category | null>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  onValueChange,
  categories,
  categoriesLoading,
  onCreateCategory,
  placeholder = "Search or add category...",
  className,
  disabled,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [createInput, setCreateInput] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSelect = (cat: Category) => {
    onValueChange(cat);
    setOpen(false);
  };

  const handleClear = () => {
    onValueChange(null);
    setCreateInput("");
    setOpen(false);
  };

  const handleCreate = async () => {
    const name = createInput.trim();
    if (!name || !onCreateCategory) return;
    setCreating(true);
    try {
      const created = await onCreateCategory(name);
      if (created) {
        onValueChange(created);
        setCreateInput("");
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const searchLower = createInput.trim().toLowerCase();
  const filtered = categories.filter((c) =>
    !searchLower ? true : c.name.toLowerCase().includes(searchLower),
  );
  const showCreate = createInput.trim().length > 0 && onCreateCategory;
  const createName = createInput.trim();
  const hasCategories = categories.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || categoriesLoading}
          className={cn(
            "min-h-9 w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {value ? (
              <>
                <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{value.name}</span>
              </>
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
          <CommandList className="max-h-[280px] py-1">
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
                <span>No category found. Type a name and add one.</span>
              )}
            </CommandEmpty>
            <CommandGroup className="p-0">
              <CommandItem
                onSelect={handleClear}
                className="flex cursor-pointer items-center gap-2 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    !value ? "border-primary bg-primary/10" : "border-muted-foreground/30",
                  )}
                >
                  {!value && <Check className="h-2.5 w-2.5 text-primary" />}
                </span>
                <span className={cn(!value && "font-medium")}>None</span>
              </CommandItem>
            </CommandGroup>
            {hasCategories && filtered.length > 0 && (
              <CommandGroup className="mt-0.5 p-0">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </div>
                {filtered.map((cat) => (
                  <CommandItem
                    key={cat.id}
                    value={`${cat.id}-${cat.name}`}
                    onSelect={() => handleSelect(cat)}
                    className="flex cursor-pointer items-center gap-2 py-2.5"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        value?.id === cat.id
                          ? "border-primary bg-primary/10"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {value?.id === cat.id && <Check className="h-2.5 w-2.5 text-primary" />}
                    </span>
                    <span className={cn("truncate", value?.id === cat.id && "font-medium")}>
                      {cat.name}
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
