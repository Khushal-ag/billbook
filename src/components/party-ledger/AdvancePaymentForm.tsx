import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
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
import type { PaymentMethod } from "@/types/invoice";

interface AdvancePaymentFormProps {
  form: UseFormReturn<{
    amount: string;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }>;
  paymentMethods: { value: PaymentMethod; label: string }[];
  isSubmitting: boolean;
  isSaving: boolean;
  onSubmit: (data: {
    amount: string;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => void;
}

export function AdvancePaymentForm({
  form,
  paymentMethods,
  isSubmitting,
  isSaving,
  onSubmit,
}: AdvancePaymentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount *</Label>
          <Input placeholder="0.00" {...register("amount")} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
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
              {paymentMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Reference Number</Label>
          <Input placeholder="e.g. UPI / cheque" {...register("referenceNumber")} />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Input placeholder="Optional note" {...register("notes")} />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Advance
        </Button>
      </div>
    </form>
  );
}
