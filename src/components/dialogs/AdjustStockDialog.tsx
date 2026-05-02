import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAdjustStock, useStockEntries } from "@/hooks/use-items";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import { stockBatchSelectLabel } from "@/lib/items/stock-entry-labels";
import { formatStockQuantity } from "@/lib/core/utils";
import { isServiceType } from "@/types/item";

const schema = z.object({
  direction: z.enum(["add", "remove"]),
  amount: z
    .string()
    .min(1, "Enter a quantity")
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid quantity")
    .refine((v) => parseFloat(v) > 0, "Quantity must be greater than zero"),
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
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { direction: "add", amount: "", reason: "" },
  });

  const direction = watch("direction");

  useEffect(() => {
    if (!open) return;
    reset({ direction: "add", amount: "", reason: "" });
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
      const only = batches[0];
      setSelectedEntryId(batches.length === 1 && only ? String(only.id) : "");
      return;
    }
    if (selectedEntryId === "" && batches.length === 1) {
      const only = batches[0];
      if (only) setSelectedEntryId(String(only.id));
    }
  }, [open, entriesLoading, batches, selectedEntryId]);

  const selectedBatch = useMemo(() => {
    const id = Number.parseInt(selectedEntryId, 10);
    if (!Number.isFinite(id)) return null;
    return batches.find((b) => b.id === id) ?? null;
  }, [batches, selectedEntryId]);

  const onHandHint =
    selectedBatch != null
      ? formatStockQuantity(selectedBatch.actualQuantity ?? selectedBatch.quantity)
      : null;

  const onSubmit = async (data: FormData) => {
    const sid = Number.parseInt(selectedEntryId, 10);
    if (!Number.isFinite(sid)) {
      showErrorToast(null, "Select a stock batch.");
      return;
    }
    const quantity = data.direction === "add" ? data.amount : `-${data.amount}`;
    try {
      await mutation.mutateAsync({
        stockEntryId: sid,
        quantity,
        reason: data.reason,
      });
      showSuccessToast("Stock adjusted");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "Couldn't adjust stock");
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
            <Label>Adjustment</Label>
            <Controller
              name="direction"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <label
                    htmlFor="adjust-stock-add"
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      field.value === "add"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="add" id="adjust-stock-add" />
                    <span className="font-medium leading-snug">Add to stock</span>
                  </label>
                  <label
                    htmlFor="adjust-stock-remove"
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      field.value === "remove"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="remove" id="adjust-stock-remove" />
                    <span className="font-medium leading-snug">Remove from stock</span>
                  </label>
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label required>
              {direction === "remove" ? "Quantity to remove" : "Quantity to add"}
            </Label>
            <Input
              inputMode="decimal"
              placeholder={direction === "remove" ? "e.g. 5" : "e.g. 10"}
              {...register("amount")}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
            {direction === "remove" && onHandHint != null ? (
              <p className="text-xs text-muted-foreground">On hand for this batch: {onHandHint}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter units only; use the options above for add vs remove.
              </p>
            )}
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
