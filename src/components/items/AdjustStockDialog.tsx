import { useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAdjustStock } from "@/hooks/use-items";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

const schema = z.object({
  quantity: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Enter a valid quantity (can be negative)"),
  reason: z.string().min(1, "Reason is required"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  itemName: string;
  /** When provided, adjustment is attributed to this batch (from By stock view) */
  stockEntryId?: number;
}

export default function AdjustStockDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  stockEntryId,
}: Props) {
  const mutation = useAdjustStock(itemId);

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
    if (open) reset({ quantity: "", reason: "" });
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync({
        quantity: data.quantity,
        reason: data.reason,
        ...(stockEntryId != null && { stockEntryId }),
      });
      showSuccessToast("Stock adjusted");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "Failed to adjust stock");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {itemName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Quantity *</Label>
            <Input placeholder="e.g. 10 or -5" {...register("quantity")} />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Positive to add stock, negative to remove.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea rows={2} placeholder="e.g. Damaged goods" {...register("reason")} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
