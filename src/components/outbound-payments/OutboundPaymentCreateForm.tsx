"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { useInvoices } from "@/hooks/use-invoices";
import { useCreateOutboundPayment } from "@/hooks/use-outbound-payments";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import { OUTBOUND_CATEGORY_OPTIONS } from "@/constants/outbound-payment";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { Party } from "@/types/party";
import type { PaymentMethod } from "@/types/invoice";
import type { OutboundPaymentCategory } from "@/types/outbound-payment";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  amount: requiredPriceString,
  paymentMethod: z.enum(["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD"]),
  referenceNumber: optionalString,
  notes: optionalString,
});

type BaseForm = z.infer<typeof baseSchema>;

export function OutboundPaymentCreateForm() {
  const router = useRouter();
  const [category, setCategory] = useState<OutboundPaymentCategory>("PARTY_PAYMENT");
  const [party, setParty] = useState<Party | null>(null);
  const [saleReturnId, setSaleReturnId] = useState<string>("");
  const [returnSearch, setReturnSearch] = useState("");
  const [expensePayee, setExpensePayee] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  const { data: returnsData, isPending: returnsLoading } = useInvoices({
    page: 1,
    pageSize: 100,
    invoiceType: "SALE_RETURN",
    status: "FINAL",
  });
  const saleReturns = useMemo(() => returnsData?.invoices ?? [], [returnsData?.invoices]);

  const filteredReturns = useMemo(() => {
    const q = returnSearch.trim().toLowerCase();
    if (!q) return saleReturns;
    return saleReturns.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.partyName ?? "").toLowerCase().includes(q),
    );
  }, [saleReturns, returnSearch]);

  const selectedReturn = useMemo(() => {
    const id = parseInt(saleReturnId, 10);
    if (!Number.isFinite(id)) return null;
    return saleReturns.find((i) => i.id === id) ?? null;
  }, [saleReturnId, saleReturns]);

  const createOutbound = useCreateOutboundPayment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (category === "SALE_RETURN_REFUND" && selectedReturn?.totalAmount) {
      setValue("amount", selectedReturn.totalAmount);
    }
  }, [category, selectedReturn?.id, selectedReturn?.totalAmount, setValue]);

  const onCategoryChange = (c: OutboundPaymentCategory) => {
    setCategory(c);
    setParty(null);
    setSaleReturnId("");
    setExpensePayee("");
    setExpenseCategory("");
    reset({ amount: "", paymentMethod: "BANK_TRANSFER", referenceNumber: "", notes: "" });
  };

  const onSubmit = async (data: BaseForm) => {
    try {
      if (category === "SALE_RETURN_REFUND") {
        if (!selectedReturn) {
          showErrorToast("Select a finalized sale return invoice.");
          return;
        }
        await createOutbound.mutateAsync({
          category: "SALE_RETURN_REFUND",
          partyId: selectedReturn.partyId,
          invoiceId: selectedReturn.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || undefined,
          notes: data.notes || undefined,
        });
      } else if (category === "PARTY_PAYMENT") {
        if (!party) {
          showErrorToast("Select a party.");
          return;
        }
        await createOutbound.mutateAsync({
          category: "PARTY_PAYMENT",
          partyId: party.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || undefined,
          notes: data.notes || undefined,
        });
      } else {
        const payeeName = expensePayee.trim();
        if (!payeeName) {
          showErrorToast("Enter who was paid (payee name).");
          return;
        }
        await createOutbound.mutateAsync({
          category: "EXPENSE",
          payeeName,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || undefined,
          notes: data.notes || undefined,
          expenseCategory: expenseCategory.trim() || undefined,
        });
      }
      showSuccessToast("Outbound payment recorded");
      router.push("/payments/outbound");
    } catch (e) {
      showErrorToast(e, "Failed to record payment");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-8">
      <div className="space-y-3">
        <Label>Type</Label>
        <RadioGroup
          value={category}
          onValueChange={(v) => onCategoryChange(v as OutboundPaymentCategory)}
          className="grid gap-2 sm:grid-cols-3"
        >
          {OUTBOUND_CATEGORY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                category === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <RadioGroupItem value={opt.value} id={opt.value} />
              <span className="leading-tight">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {category === "SALE_RETURN_REFUND" && (
        <div className="space-y-3">
          <Label>Sale return invoice *</Label>
          <Input
            placeholder="Search by number or party…"
            value={returnSearch}
            onChange={(e) => setReturnSearch(e.target.value)}
            className="mb-2"
          />
          <Select value={saleReturnId} onValueChange={setSaleReturnId} disabled={returnsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={returnsLoading ? "Loading…" : "Select sale return…"} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {filteredReturns.map((inv) => (
                <SelectItem key={inv.id} value={String(inv.id)}>
                  {inv.invoiceNumber}
                  {inv.partyName ? ` · ${inv.partyName}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedReturn && (
            <p className="text-xs text-muted-foreground">
              Party ID {selectedReturn.partyId} · Total {selectedReturn.totalAmount}
            </p>
          )}
        </div>
      )}

      {category === "PARTY_PAYMENT" && (
        <div className="space-y-2">
          <Label>Party *</Label>
          <PartyAutocomplete
            value={party}
            onValueChange={setParty}
            serverSearch
            placeholder="Search party…"
          />
        </div>
      )}

      {category === "EXPENSE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Payee name *</Label>
            <Input
              placeholder="Who received the payment"
              value={expensePayee}
              onChange={(e) => setExpensePayee(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Expense category</Label>
            <Input
              placeholder="Optional"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Amount *</Label>
        <Input placeholder="0.00" {...register("amount")} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Payment method</Label>
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
        <Label>Reference</Label>
        <Input placeholder="UTR / ref." {...register("referenceNumber")} />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea rows={2} {...register("notes")} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/payments/outbound")}>
          Cancel
        </Button>
        <Button type="submit" disabled={createOutbound.isPending}>
          {createOutbound.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record payment
        </Button>
      </div>
    </form>
  );
}
