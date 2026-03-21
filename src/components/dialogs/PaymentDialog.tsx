import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { useRecordPayment } from "@/hooks/use-invoices";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import type { PaymentMethod } from "@/types/invoice";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { formatCurrency } from "@/lib/utils";
import type { RecordInvoicePaymentData } from "@/types/receipt";

const schema = z.object({
  amount: requiredPriceString,
  paymentMethod: z.enum(["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD"]),
  referenceNumber: optionalString,
  notes: optionalString,
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  balanceDue?: string;
}

export default function PaymentDialog({ open, onOpenChange, invoiceId, balanceDue }: Props) {
  const mutation = useRecordPayment(invoiceId);
  const [successReceipt, setSuccessReceipt] = useState<RecordInvoicePaymentData | null>(null);
  const wasOpenRef = useRef(false);

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
      amount: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

  // Only reset when the dialog opens — not when balanceDue changes after submit (invalidation
  // refetches invoice and would otherwise clear the success screen and show the form again).
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (justOpened) {
      setSuccessReceipt(null);
      reset({
        amount: balanceDue ?? "",
        paymentMethod: "CASH",
        referenceNumber: "",
        notes: "",
      });
    }
  }, [open, balanceDue, reset]);

  const handleClose = (next: boolean) => {
    if (!next) setSuccessReceipt(null);
    onOpenChange(next);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await mutation.mutateAsync({
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });
      if (result.mode === "receipt") {
        setSuccessReceipt(result.data);
      } else {
        showSuccessToast("Payment recorded");
        handleClose(false);
      }
    } catch (err) {
      showErrorToast(err, "Failed to record payment");
    }
  };

  const unallocated = successReceipt
    ? parseFloat(successReceipt.receipt.unallocatedAmount || "0") || 0
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {successReceipt ? (
          <>
            <DialogHeader>
              <DialogTitle>Payment recorded</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">{successReceipt.receipt.receiptNumber}</span> — total{" "}
                {formatCurrency(successReceipt.receipt.totalAmount)}
              </p>
              <p className="text-muted-foreground">
                Allocated to this invoice:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(successReceipt.allocatedToThisInvoice)}
                </span>
              </p>
              {unallocated > 0.001 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
                  <p className="font-medium">Party advance on this receipt</p>
                  <p className="mt-1 tabular-nums">
                    {formatCurrency(successReceipt.receipt.unallocatedAmount)} unallocated —
                    allocate to other invoices from the receipt.
                  </p>
                  <Button className="mt-3" variant="secondary" size="sm" asChild>
                    <Link href={`/receipts/${successReceipt.receipt.id}`}>Open receipt</Link>
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleClose(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input placeholder="0.00" {...register("amount")} />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={watch("paymentMethod")}
                  onValueChange={(v) => setValue("paymentMethod", v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input placeholder="e.g. cheque / UPI ref" {...register("referenceNumber")} />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={2} {...register("notes")} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
