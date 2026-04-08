import { useEffect, useRef, useState } from "react";
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
import { ExternalLink, Loader2 } from "lucide-react";
import { useRecordSupplierPayment } from "@/hooks/use-invoices";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import type { PaymentMethod, RecordSupplierPaymentData } from "@/types/invoice";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast } from "@/lib/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/trial";
import { formatCurrency } from "@/lib/utils";
import { openSignedPdfFromApiPath } from "@/lib/signed-pdf";
import { ApiClientError } from "@/api/error";
import { augmentApiClientErrorForPayment } from "@/lib/payment-errors";

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

export default function SupplierPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  balanceDue,
}: Props) {
  const mutation = useRecordSupplierPayment(invoiceId);
  const [successPayload, setSuccessPayload] = useState<RecordSupplierPaymentData | null>(null);
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
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (justOpened) {
      setSuccessPayload(null);
      reset({
        amount: balanceDue ?? "",
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: "",
        notes: "",
      });
    }
  }, [open, balanceDue, reset]);

  const handleClose = (next: boolean) => {
    if (!next) setSuccessPayload(null);
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
      setSuccessPayload(result);
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      if (err instanceof ApiClientError) {
        showErrorToast(augmentApiClientErrorForPayment(err), "Failed to record payment");
      } else {
        showErrorToast(err, "Failed to record payment");
      }
    }
  };

  const payment = successPayload?.payment;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {successPayload && payment ? (
          <>
            <DialogHeader>
              <DialogTitle>Payment recorded</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium tabular-nums">
                  {payment.paymentNumber ?? `Payment #${payment.id}`}
                </span>{" "}
                — {formatCurrency(payment.amount)}
              </p>
              <p className="text-muted-foreground">
                Applied to this bill:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(successPayload.allocatedToThisInvoice)}
                </span>
              </p>
              <p className="text-muted-foreground">
                Bill paid total after this payment:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(successPayload.invoicePaidAmountAfter)}
                </span>
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() =>
                  void openSignedPdfFromApiPath(`/payments/outbound/${payment.id}/pdf`, {
                    unavailable: "Voucher PDF not available.",
                    failed: "Failed to open voucher PDF",
                  })
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Voucher PDF
              </Button>
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
              <p className="text-sm text-muted-foreground">
                Pays the supplier and updates this purchase bill (outbound voucher).
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label required>Amount</Label>
                <Input placeholder="0.00" {...register("amount")} aria-invalid={!!errors.amount} />
                {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
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
                <Input placeholder="e.g. UPI / bank ref" {...register("referenceNumber")} />
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
