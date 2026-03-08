import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemType, StockEntry, UpdateStockEntryRequest } from "@/types/item";
import type { Party } from "@/types/party";

interface EditableStockEntry {
  id: number;
  itemName: string;
  itemType: ItemType;
  unit?: string | null;
  purchaseDate?: string | null;
  sellingPrice: string;
  purchasePrice?: string | null;
  supplierId?: number | null;
}

interface EditStockEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: EditableStockEntry | null;
  suppliers: Party[];
  onSave: (entryId: number, data: UpdateStockEntryRequest) => Promise<StockEntry | void>;
}

const NONE_SUPPLIER = "__none__";

export default function EditStockEntryDialog({
  open,
  onOpenChange,
  entry,
  suppliers,
  onSave,
}: EditStockEntryDialogProps) {
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPriceDecimal, setSellingPriceDecimal] = useState(false);
  const [purchasePriceDecimal, setPurchasePriceDecimal] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entry) return;
    const nextSellingPrice = String(entry.sellingPrice ?? "");
    const nextPurchasePrice =
      entry.purchasePrice == null || entry.purchasePrice === "—" ? "" : entry.purchasePrice;
    setSellingPrice(nextSellingPrice);
    setPurchasePrice(nextPurchasePrice);
    setSellingPriceDecimal(nextSellingPrice.includes("."));
    setPurchasePriceDecimal(nextPurchasePrice.includes("."));
    setPurchaseDate(entry.purchaseDate ?? "");
    setSupplierId(entry.supplierId ?? null);
    setError(null);
  }, [open, entry]);

  const isStockItem = entry?.itemType === "STOCK";

  const supplierValue = useMemo(() => {
    if (supplierId == null) return NONE_SUPPLIER;
    return String(supplierId);
  }, [supplierId]);

  const handleSave = async () => {
    if (!entry) return;

    const parsedSellingPrice = Number(sellingPrice.trim());
    if (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice < 0) {
      setError("Selling price must be 0 or more");
      return;
    }

    const payload: UpdateStockEntryRequest = {
      sellingPrice: String(parsedSellingPrice),
      supplierId,
    };

    if (isStockItem) {
      if (!purchaseDate.trim()) {
        setError("Purchase date is required");
        return;
      }
      const parsedPurchasePrice = Number(purchasePrice.trim());
      if (!Number.isFinite(parsedPurchasePrice) || parsedPurchasePrice < 0) {
        setError("Purchase price must be 0 or more");
        return;
      }
      payload.purchaseDate = purchaseDate;
      payload.purchasePrice = String(parsedPurchasePrice);
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave(entry.id, payload);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Stock Entry - {entry?.itemName ?? ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Selling Price *</Label>
            <Input
              type="number"
              min="0"
              step={sellingPriceDecimal ? "0.25" : "1"}
              value={sellingPrice}
              onChange={(e) => {
                const value = e.target.value;
                const hasDecimal = value.includes(".");
                setSellingPrice(value);
                setSellingPriceDecimal(value === "" ? false : hasDecimal || sellingPriceDecimal);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Select
              value={supplierValue}
              onValueChange={(value) => {
                if (value === NONE_SUPPLIER) {
                  setSupplierId(null);
                  return;
                }
                setSupplierId(Number(value));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_SUPPLIER}>No vendor</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isStockItem && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Price *</Label>
                <Input
                  type="number"
                  min="0"
                  step={purchasePriceDecimal ? "0.25" : "1"}
                  value={purchasePrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    const hasDecimal = value.includes(".");
                    setPurchasePrice(value);
                    setPurchasePriceDecimal(
                      value === "" ? false : hasDecimal || purchasePriceDecimal,
                    );
                  }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
