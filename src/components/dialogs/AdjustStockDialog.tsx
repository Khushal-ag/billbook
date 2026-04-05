import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAdjustStock, useStockEntries } from "@/hooks/use-items";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { stockBatchSelectLabel } from "@/lib/stock-entry-labels";
import { isServiceType } from "@/types/item";

const schema = z.object({
  quantity: z
    .string()
    .regex(/^-?\d+(\.\d{1,2})?$/, "Enter a valid quantity (can be negative)")
    .refine((v) => parseFloat(v) !== 0, "Quantity cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemName: string;
  /** Pre-selected batch when opening from “By stock” row */
  stockEntryId?: number;
}

export default function AdjustStockDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  stockEntryId: initialStockEntryId,
}: Props) {
  const mutation = useAdjustStock(itemId);
  const { data: stockList, isPending: entriesLoading } = useStockEntries(
    { itemId, limit: 200 },
    { enabled: open && itemId > 0 },
  );

  const batches = useMemo(() => {
    return (stockList?.entries ?? []).filter((e) => !isServiceType(e.itemType ?? "STOCK"));
  }, [stockList?.entries]);

  const [selectedEntryId, setSelectedEntryId] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: "", reason: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ quantity: "", reason: "" });
    setSelectedEntryId(
      initialStockEntryId != null && Number.isFinite(initialStockEntryId)
        ? String(initialStockEntryId)
        : "",
    );
  }, [open, initialStockEntryId, reset]);

  useEffect(() => {
    if (!open || entriesLoading) return;
    const validIds = new Set(batches.map((b) => b.id));
    const current = Number.parseInt(selectedEntryId, 10);
    if (selectedEntryId !== "" && !validIds.has(current)) {
      setSelectedEntryId(batches.length === 1 ? String(batches[0].id) : "");
      return;
    }
    if (selectedEntryId === "" && batches.length === 1) {
      setSelectedEntryId(String(batches[0].id));
    }
  }, [open, entriesLoading, batches, selectedEntryId]);

  const onSubmit = async (data: FormData) => {
    const sid = Number.parseInt(selectedEntryId, 10);
    if (!Number.isFinite(sid)) {
      showErrorToast(null, "Select a stock batch.");
      return;
    }
    try {
      await mutation.mutateAsync({
        stockEntryId: sid,
        quantity: data.quantity,
        reason: data.reason,
      });
      showSuccessToast("Stock adjusted");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "Failed to adjust stock");
    }
  };

  const selectDisabled = entriesLoading || batches.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {itemName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label required>Batch</Label>
            <Select
              value={selectedEntryId}
              onValueChange={setSelectedEntryId}
              disabled={selectDisabled}
            >
              <SelectTrigger aria-invalid={!selectedEntryId && !selectDisabled}>
                <SelectValue
                  placeholder={
                    entriesLoading
                      ? "Loading batches…"
                      : batches.length === 0
                        ? "No batches for this item"
                        : "Select batch"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {batches.map((entry) => (
                  <SelectItem key={entry.id} value={String(entry.id)}>
                    {stockBatchSelectLabel(entry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Adjustments are posted to one batch. Choose the batch whose on-hand quantity should
              change.
            </p>
          </div>

          <div className="space-y-2">
            <Label required>Quantity</Label>
            <Input
              placeholder="e.g. 10 or -5"
              {...register("quantity")}
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && <FieldError>{errors.quantity.message}</FieldError>}
            <p className="text-xs text-muted-foreground">
              Positive to add stock, negative to remove.
            </p>
          </div>

          <div className="space-y-2">
            <Label required>Reason</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Damaged goods"
              {...register("reason")}
              aria-invalid={!!errors.reason}
            />
            {errors.reason && <FieldError>{errors.reason.message}</FieldError>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                mutation.isPending ||
                !selectedEntryId ||
                entriesLoading ||
                batches.length === 0
              }
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
