import { useState, useCallback, useRef } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ItemAutocomplete } from "@/components/items/ItemAutocomplete";
import { VendorAutocomplete } from "@/components/items/VendorAutocomplete";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { cn } from "@/lib/utils";
import { parseISODateString, toISODateString, formatISODateDisplay } from "@/lib/date";
import { formatCurrency, formatQuantity } from "@/lib/utils";
import type { Item } from "@/types/item";
import type { CreateStockEntryRequest } from "@/types/item";
import type { Party } from "@/types/party";

const today = () => new Date().toISOString().slice(0, 10);

/** Single input row state */
interface StockEntryRow {
  id: string;
  item: Item | null;
  supplierId: number | null;
  purchaseDate: string;
  quantity: string;
  sellingPrice: string;
  purchasePrice: string;
}

/** Entry shown in the "added this session" grid (UI state only) */
interface SessionEntry {
  id: string;
  itemName: string;
  unit: string;
  quantity: string;
  purchaseDate: string;
  sellingPrice: string;
  purchasePrice: string;
  supplierName: string | null;
  isService?: boolean;
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
  const [row, setRow] = useState<StockEntryRow>(() => defaultRow());
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([]);
  const [addVendorDialogOpen, setAddVendorDialogOpen] = useState(false);
  const pendingVendorCreatedRef = useRef<((party: Party) => void) | null>(null);

  const updateRow = useCallback((patch: Partial<StockEntryRow>) => {
    setRow((prev) => ({ ...prev, ...patch }));
  }, []);

  const isService = row.item?.type === "SERVICE";

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!row.item || !row.quantity.trim()) return;
    if (!isService && !row.purchaseDate) return;
    const payload: CreateStockEntryRequest = isService
      ? {
          itemId: row.item.id,
          quantity: String(Number(row.quantity)),
          sellingPrice: String(row.sellingPrice || "0"),
          supplierId: row.supplierId ?? undefined,
        }
      : {
          itemId: row.item.id,
          purchaseDate: row.purchaseDate,
          quantity: String(Number(row.quantity)),
          sellingPrice: String(row.sellingPrice || "0"),
          purchasePrice: String(row.purchasePrice || "0"),
          supplierId: row.supplierId ?? undefined,
        };
    try {
      await onSubmit([payload]);
    } catch {
      return;
    }
    const supplier = row.supplierId != null ? suppliers.find((s) => s.id === row.supplierId) : null;
    setSessionEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        itemName: row.item!.name,
        unit: row.item!.unit ?? "—",
        quantity: row.quantity,
        purchaseDate: isService ? new Date().toISOString().slice(0, 10) : row.purchaseDate,
        sellingPrice: row.sellingPrice || "0",
        purchasePrice: isService ? "0" : row.purchasePrice || "0",
        supplierName: supplier?.name ?? null,
        isService,
      },
    ]);
    setRow(defaultRow());
  };

  const canAdd = !!(row.item && row.quantity.trim() && (isService || row.purchaseDate));
  const inputClass = "h-9 text-sm";

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddStock} className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Add stock entry
          </p>
          <div className="data-table-container">
            <table
              className="w-full min-w-[800px] text-sm"
              role="table"
              aria-label="Add stock entry"
            >
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="min-w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Item *
                  </th>
                  <th className="min-w-[160px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vendor
                  </th>
                  <th className="min-w-[120px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date *
                  </th>
                  <th className="min-w-[100px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Qty *
                  </th>
                  <th className="min-w-[100px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selling price
                  </th>
                  <th className="min-w-[100px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Purchase price
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-2.5 align-middle">
                    <ItemAutocomplete
                      value={row.item}
                      onValueChange={(item) => updateRow({ item })}
                      items={items}
                      stockOnly={false}
                      compact
                      placeholder="Type to search item..."
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <VendorAutocomplete
                      value={
                        row.supplierId != null
                          ? (suppliers.find((s) => s.id === row.supplierId) ?? null)
                          : null
                      }
                      onValueChange={(vendor) => updateRow({ supplierId: vendor?.id ?? null })}
                      suppliers={suppliers}
                      compact
                      placeholder="Search vendor..."
                      onAddVendor={(onCreated) => {
                        pendingVendorCreatedRef.current = onCreated;
                        setAddVendorDialogOpen(true);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {!isService && (
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
                              if (date) updateRow({ purchaseDate: toISODateString(date) });
                            }}
                            initialFocus
                            defaultMonth={parseISODateString(row.purchaseDate) ?? new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    {isService && <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={row.quantity}
                        onChange={(e) => updateRow({ quantity: e.target.value })}
                        className={`${inputClass} w-20 shrink-0 text-right tabular-nums`}
                      />
                      {row.item?.unit && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {row.item.unit}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={row.sellingPrice}
                      onChange={(e) => updateRow({ sellingPrice: e.target.value })}
                      className={`${inputClass} text-right tabular-nums`}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle">
                    {!isService && (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={row.purchasePrice}
                        onChange={(e) => updateRow({ purchasePrice: e.target.value })}
                        className={`${inputClass} text-right tabular-nums`}
                      />
                    )}
                    {isService && <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={!canAdd || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add stock
            </Button>
          </div>
        </div>
      </form>

      {sessionEntries.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/10">
          <p className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Added in this session
          </p>
          <div className="data-table-container">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Stock entries added in this session"
            >
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Item</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Vendor</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Qty</th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    Selling price
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    Purchase price
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessionEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{entry.itemName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{entry.supplierName ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {entry.isService ? "—" : formatISODateDisplay(entry.purchaseDate)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {formatQuantity(entry.quantity)} {entry.unit}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatCurrency(entry.sellingPrice)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {entry.isService ? "—" : formatCurrency(entry.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </div>
  );
}
