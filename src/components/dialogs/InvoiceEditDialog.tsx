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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useUpdateInvoice } from "@/hooks/use-invoices";
import { useParties } from "@/hooks/use-parties";
import type { InvoiceDetail } from "@/types/invoice";
import { dateString, optionalString, priceString, percentString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";

const schema = z.object({
  partyId: z.coerce.number().min(1, "Select a party"),
  invoiceDate: dateString,
  dueDate: optionalString,
  notes: optionalString,
  discountAmount: priceString,
  discountPercent: percentString,
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceDetail;
}

export default function InvoiceEditDialog({ open, onOpenChange, invoice }: Props) {
  const updateMutation = useUpdateInvoice(invoice.id);
  const { data: partiesData } = useParties();
  const parties = (partiesData?.parties ?? []).filter((p) => !p.deletedAt);

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
      partyId: invoice.partyId,
      invoiceDate: invoice.invoiceDate.slice(0, 10),
      dueDate: invoice.dueDate?.slice(0, 10) ?? "",
      notes: invoice.notes ?? "",
      discountAmount: invoice.discountAmount ?? "",
      discountPercent: invoice.discountPercent ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        partyId: invoice.partyId,
        invoiceDate: invoice.invoiceDate.slice(0, 10),
        dueDate: invoice.dueDate?.slice(0, 10) ?? "",
        notes: invoice.notes ?? "",
        discountAmount: invoice.discountAmount ?? "",
        discountPercent: invoice.discountPercent ?? "",
      });
    }
  }, [open, invoice, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateMutation.mutateAsync({
        partyId: data.partyId,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
        discountAmount: data.discountAmount || undefined,
        discountPercent: data.discountPercent || undefined,
      });
      showSuccessToast("Invoice updated");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "Failed to update invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Invoice {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Party</Label>
            <Select
              value={String(watch("partyId"))}
              onValueChange={(v) => setValue("partyId", Number(v))}
            >
              <SelectTrigger disabled={parties.length === 0}>
                <SelectValue
                  placeholder={parties.length === 0 ? "No parties available" : "Select party"}
                />
              </SelectTrigger>
              <SelectContent>
                {parties.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No parties available. Create a party first.
                  </div>
                ) : (
                  parties.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.partyId && <p className="text-xs text-destructive">{errors.partyId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input type="date" {...register("invoiceDate")} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Amount</Label>
              <Input placeholder="0.00" {...register("discountAmount")} />
            </div>
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input placeholder="0.00" {...register("discountPercent")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={2} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
