import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ItemAutocomplete } from "@/components/items/ItemAutocomplete";
import { VendorAutocomplete } from "@/components/items/VendorAutocomplete";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { cn } from "@/lib/utils";
import { parseISODateString, toISODateString, formatISODateDisplay } from "@/lib/date";
import type { Item } from "@/types/item";
import type { CreateStockEntryRequest } from "@/types/item";
import type { Party } from "@/types/party";

const today = () => new Date().toISOString().slice(0, 10);

export interface StockEntryRow {
  id: string;
  item: Item | null;
  supplierId: number | null;
  purchaseDate: string;
  quantity: string;
  sellingPrice: string;
  purchasePrice: string;
}

const defaultRow = (): StockEntryRow => ({
  id: crypto.randomUUID(),
  item: null,
  supplierId: null,
  purchaseDate: today(),
  quantity: "",
  sellingPrice: "",
  purchasePrice: "",
});

interface StockEntryGridProps {
  items: Item[];
  suppliers: Party[];
  onSubmit: (entries: CreateStockEntryRequest[]) => Promise<void>;
  isSubmitting?: boolean;
}

export function StockEntryGrid({ items, suppliers, onSubmit, isSubmitting }: StockEntryGridProps) {
  const [rows, setRows] = useState<StockEntryRow[]>(() => [defaultRow()]);
  const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);
  const pendingVendorCreatedRef = useRef<((party: Party) => void) | null>(null);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, defaultRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? [defaultRow()] : prev.filter((r) => r.id !== id)));
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<StockEntryRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all rows with any data are complete
    const hasIncompleteRow = rows.some((r) => {
      const hasAnyData = r.item || r.quantity || r.supplierId || r.sellingPrice || r.purchasePrice;
      const isComplete =
        r.item && r.quantity && r.purchaseDate && r.supplierId && r.sellingPrice && r.purchasePrice;
      return hasAnyData && !isComplete;
    });

    if (hasIncompleteRow) {
      alert("Please complete all fields in every row before saving.");
      return;
    }

    const payloads: CreateStockEntryRequest[] = rows
      .filter(
        (r) =>
          r.item &&
          r.quantity &&
          r.purchaseDate &&
          r.supplierId &&
          r.sellingPrice &&
          r.purchasePrice,
      )
      .map((r) => ({
        itemId: r.item!.id,
        purchaseDate: r.purchaseDate,
        quantity: r.quantity.trim() ? String(Number(r.quantity)) : "0",
        sellingPrice: String(r.sellingPrice || "0"),
        purchasePrice: String(r.purchasePrice || "0"),
        supplierId: r.supplierId ?? null,
      }));
    if (payloads.length === 0) return;
    await onSubmit(payloads);
    setRows([defaultRow()]);
  };

  // At least one row has data, and all rows with data are complete
  const canSubmit =
    rows.some((r) => {
      const hasAnyData = r.item || r.quantity || r.supplierId || r.sellingPrice || r.purchasePrice;
      const isComplete =
        r.item && r.quantity && r.purchaseDate && r.supplierId && r.sellingPrice && r.purchasePrice;
      return hasAnyData && isComplete;
    }) &&
    !rows.some((r) => {
      const hasAnyData = r.item || r.quantity || r.supplierId || r.sellingPrice || r.purchasePrice;
      const isComplete =
        r.item && r.quantity && r.purchaseDate && r.supplierId && r.sellingPrice && r.purchasePrice;
      return hasAnyData && !isComplete;
    });

  const inputClass = "h-9 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="data-table-container">
        <table className="w-full min-w-[840px] text-sm" role="table" aria-label="Add stock entries">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Item *
              </th>
              <th className="min-w-[200px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vendor *
              </th>
              <th className="min-w-[130px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Purchase Date *
              </th>
              <th className="min-w-[120px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qty *
              </th>
              <th className="min-w-[100px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selling price *
              </th>
              <th className="min-w-[100px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Purchase price *
              </th>
              <th className="w-12 min-w-[48px] px-2 py-3" aria-label="Remove row" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/20">
                <td className="px-4 py-2.5 align-middle">
                  <ItemAutocomplete
                    value={row.item}
                    onValueChange={(item) => updateRow(row.id, { item })}
                    items={items}
                    stockOnly
                    compact
                    placeholder="Type to search item..."
                  />
                </td>
                <td className="px-4 py-2.5 align-middle">
                  <VendorAutocomplete
                    value={
                      row.supplierId != null
                        ? (suppliers.find((s) => s.id === row.supplierId) ?? null)
                        : null
                    }
                    onValueChange={(vendor) =>
                      updateRow(row.id, { supplierId: vendor?.id ?? null })
                    }
                    suppliers={suppliers}
                    compact
                    placeholder="Type to search vendor..."
                    onAddVendor={(onCreated) => {
                      pendingVendorCreatedRef.current = onCreated;
                      setAddVendorDialogOpen(true);
                    }}
                  />
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start gap-2 border-input bg-background px-3 text-left font-normal shadow-none hover:bg-muted hover:text-foreground",
                          !row.purchaseDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {formatISODateDisplay(row.purchaseDate) || "Select date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={parseISODateString(row.purchaseDate) ?? undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateRow(row.id, { purchaseDate: toISODateString(date) });
                          }
                        }}
                        initialFocus
                        defaultMonth={parseISODateString(row.purchaseDate) ?? new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                      className={`${inputClass} w-20 shrink-0 text-right tabular-nums`}
                    />
                    {row.item?.unit && (
                      <span
                        className="shrink-0 text-xs text-muted-foreground"
                        title={`Unit: ${row.item.unit}`}
                      >
                        {row.item.unit}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    placeholder="0"
                    value={row.sellingPrice}
                    onChange={(e) => updateRow(row.id, { sellingPrice: e.target.value })}
                    className={`${inputClass} text-right tabular-nums`}
                  />
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    placeholder="0"
                    value={row.purchasePrice}
                    onChange={(e) => updateRow(row.id, { purchasePrice: e.target.value })}
                    className={`${inputClass} text-right tabular-nums`}
                  />
                </td>
                <td className="px-2 py-2.5 align-middle">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    title="Remove row"
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Add row
        </Button>
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save stock entries
        </Button>
      </div>

      <PartyDialog
        open={addVendorDialogOpen}
        onOpenChange={(open) => {
          setAddVendorDialogOpen(open);
          if (!open) pendingVendorCreatedRef.current = null;
        }}
        defaultType="SUPPLIER"
        typeLocked
        onSuccess={(party) => {
          pendingVendorCreatedRef.current?.(party);
          pendingVendorCreatedRef.current = null;
        }}
      />
    </form>
  );
}
