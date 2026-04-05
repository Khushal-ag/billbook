import { useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Loader2 } from "lucide-react";
import { useCreateCreditNote } from "@/hooks/use-credit-notes";
import { useInvoices, useInvoice } from "@/hooks/use-invoices";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { withInvoiceQuantityErrorDetails } from "@/lib/invoice-quantity-error-details";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/trial";
import type { InvoiceItem } from "@/types/invoice";

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

/** Sale invoices only: at least one catalog line linked to a stock batch (required for inventory credit). */
function invoiceHasStockBatchLinesForInventoryCredit(items: InvoiceItem[] | undefined): boolean {
  return items?.some((line) => line.itemId != null && line.stockEntryId != null) ?? false;
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

  const watchedInvoiceId = watch("invoiceId");
  const { data: invoiceDetail, isPending: invoiceDetailPending } = useInvoice(
    watchedInvoiceId > 0 ? watchedInvoiceId : undefined,
  );

  const detailReady =
    watchedInvoiceId > 0 && !invoiceDetailPending && invoiceDetail?.id === watchedInvoiceId;

  const isSaleInvoice = detailReady && invoiceDetail?.invoiceType === "SALE_INVOICE";
  const canAdjustInventory = useMemo(
    () => isSaleInvoice && invoiceHasStockBatchLinesForInventoryCredit(invoiceDetail?.items),
    [isSaleInvoice, invoiceDetail?.items],
  );

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

  useEffect(() => {
    if (!open) return;
    if (!canAdjustInventory) {
      setValue("affectsInventory", false);
    }
  }, [open, canAdjustInventory, setValue]);

  const selectedInvoice = invoices.find((inv) => inv.id === watchedInvoiceId);
  const invoiceTotal = parseFloat(selectedInvoice?.totalAmount ?? "0") || 0;
  const invoicePaid = parseFloat(selectedInvoice?.paidAmount ?? "0") || 0;
  const invoiceDue = Math.max(0, invoiceTotal - invoicePaid);

  const onSubmit = async (data: FormData) => {
    const amt = parseFloat(data.amount) || 0;
    if (selectedInvoice && amt > invoiceTotal + 0.01) {
      showErrorToast(
        `Amount (${data.amount}) cannot exceed invoice total (${selectedInvoice.totalAmount}).`,
      );
      return;
    }

    const affectsInventoryEffective =
      detailReady &&
      invoiceDetail?.invoiceType === "SALE_INVOICE" &&
      invoiceHasStockBatchLinesForInventoryCredit(invoiceDetail.items) &&
      data.affectsInventory === true;

    try {
      await mutation.mutateAsync({
        invoiceId: data.invoiceId,
        amount: data.amount,
        reason: data.reason || undefined,
        affectsInventory: affectsInventoryEffective,
      });
      showSuccessToast("Credit note created");
      onOpenChange(false);
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      showErrorToast(withInvoiceQuantityErrorDetails(err), "Failed to create credit note");
    }
  };

  const inventoryTooltip = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-label="How inventory credit works"
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] space-y-2 text-xs leading-snug">
          <p>
            When you finalize this credit note with this option on, stock is increased using RETURN
            movements on the underlying sale batches (no extra fields on finalize).
          </p>
          <p className="text-muted-foreground">
            Quantity per stock line is proportional to the credit: roughly{" "}
            <span className="font-mono text-foreground">
              creditAmount × lineQuantity ÷ invoiceTotal
            </span>{" "}
            (by line, not a separate monetary split per line).
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Credit Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label required>Invoice</Label>
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
                      {inv.invoiceNumber} — {inv.partyName?.trim() || "Unknown party"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.invoiceId && <FieldError>{errors.invoiceId.message}</FieldError>}
          </div>

          <div className="space-y-2">
            <Label required>Amount</Label>
            <Input placeholder="0.00" {...register("amount")} aria-invalid={!!errors.amount} />
            {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
            {selectedInvoice && (
              <p className="text-xs text-muted-foreground">
                Invoice total: {selectedInvoice.totalAmount} — Due: {invoiceDue.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea rows={2} {...register("reason")} />
          </div>

          {watchedInvoiceId > 0 && invoiceDetailPending ? (
            <p className="text-xs text-muted-foreground">Loading invoice details…</p>
          ) : null}

          {detailReady && invoiceDetail.invoiceType !== "SALE_INVOICE" ? (
            <p className="text-xs text-muted-foreground">
              Inventory adjustment applies only to sales invoices. This document is not a sale, so
              stock will not be changed.
            </p>
          ) : null}

          {isSaleInvoice ? (
            canAdjustInventory ? (
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="affectsInventory"
                    checked={watch("affectsInventory")}
                    onCheckedChange={(v) => setValue("affectsInventory", !!v)}
                    disabled={!canAdjustInventory}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="affectsInventory" className="cursor-pointer font-normal">
                        Increase stock when finalized (linked sale batches)
                      </Label>
                      {inventoryTooltip}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only available for finalized sales that include at least one catalog stock
                      line with a batch. Finalize runs RETURN movements automatically when this was
                      enabled on create.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                This sale has no catalog stock lines with a stock batch, so inventory cannot be
                increased from this credit note. Create the credit without stock impact, or pick
                another invoice.
              </p>
            )
          ) : null}

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
