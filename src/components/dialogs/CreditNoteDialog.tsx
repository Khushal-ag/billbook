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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateCreditNote } from "@/hooks/use-credit-notes";
import { useInvoices } from "@/hooks/use-invoices";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

const schema = z.object({
  invoiceId: z.coerce.number().min(1, "Select an invoice"),
  amount: requiredPriceString,
  reason: optionalString,
  affectsInventory: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInvoiceId?: number;
}

export default function CreditNoteDialog({ open, onOpenChange, defaultInvoiceId }: Props) {
  const mutation = useCreateCreditNote();
  const { data: invoicesData } = useInvoices({ status: "FINAL" });
  const invoices = invoicesData?.invoices ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: defaultInvoiceId ?? 0,
      amount: "",
      reason: "",
      affectsInventory: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        invoiceId: defaultInvoiceId ?? 0,
        amount: "",
        reason: "",
        affectsInventory: false,
      });
    }
  }, [open, defaultInvoiceId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync({
        invoiceId: data.invoiceId,
        amount: data.amount,
        reason: data.reason || undefined,
        affectsInventory: data.affectsInventory,
      });
      showSuccessToast("Credit note created");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "Failed to create credit note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Credit Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Invoice *</Label>
            <Select
              value={String(watch("invoiceId"))}
              onValueChange={(v) => setValue("invoiceId", Number(v))}
            >
              <SelectTrigger disabled={invoices.length === 0}>
                <SelectValue
                  placeholder={invoices.length === 0 ? "No invoices available" : "Select invoice"}
                />
              </SelectTrigger>
              <SelectContent>
                {invoices.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No finalized invoices available. Create and finalize an invoice first.
                  </div>
                ) : (
                  invoices.map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      {inv.invoiceNumber} — {inv.partyName ?? `Party #${inv.partyId}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.invoiceId && (
              <p className="text-xs text-destructive">{errors.invoiceId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input placeholder="0.00" {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea rows={2} {...register("reason")} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="affectsInventory"
              checked={watch("affectsInventory")}
              onCheckedChange={(v) => setValue("affectsInventory", !!v)}
            />
            <Label htmlFor="affectsInventory" className="cursor-pointer font-normal">
              Affects inventory (reverses stock changes)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Credit Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
