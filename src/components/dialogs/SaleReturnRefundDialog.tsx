import { useEffect, useRef } from "react";
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
import { useCreateOutboundPayment } from "@/hooks/use-outbound-payments";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import type { PaymentMethod } from "@/types/invoice";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/trial";

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
  partyId: number;
  /** Outstanding refund amount (same field as balance due on the return). */
  refundDue?: string;
}

export default function SaleReturnRefundDialog({
  open,
  onOpenChange,
  invoiceId,
  partyId,
  refundDue,
}: Props) {
  const mutation = useCreateOutboundPayment();
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
      reset({
        amount: refundDue ?? "",
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: "",
        notes: "",
      });
    }
  }, [open, refundDue, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await mutation.mutateAsync({
        category: "SALE_RETURN_REFUND",
        partyId,
        invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });
      showSuccessToast("Refund recorded");
      onOpenChange(false);
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      showErrorToast(err, "Failed to record refund");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Refund</DialogTitle>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
