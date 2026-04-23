"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
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
import { InvoiceLinkedCombobox } from "@/components/outbound-payments/InvoiceLinkedCombobox";
import { useInvoice } from "@/hooks/use-invoices";
import { useCreateOutboundPayment } from "@/hooks/use-outbound-payments";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import { OUTBOUND_CATEGORY_OPTIONS } from "@/constants/outbound-payment";
import { requiredPriceString, optionalString } from "@/lib/core/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/business/trial";
import { getInvoiceBalanceDue } from "@/lib/invoice/invoice";
import { ApiClientError } from "@/api/error";
import { augmentApiClientErrorForPayment } from "@/lib/payments/payment-errors";
import type { Party } from "@/types/party";
import type { Invoice, PaymentMethod } from "@/types/invoice";
import type { OutboundPaymentCategory } from "@/types/outbound-payment";
import { cn, formatCurrency } from "@/lib/core/utils";

function purchaseInvoiceOptionLabel(inv: Invoice): string {
  const due = formatCurrency(String(getInvoiceBalanceDue(inv)));
  const vendorBill = inv.originalBillNumber?.trim();
  if (vendorBill) {
    return `${inv.invoiceNumber} · Vendor bill ${vendorBill} · ${due} due`;
  }
  return `${inv.invoiceNumber} · ${due} due`;
}

function saleReturnOptionLabel(inv: Invoice): string {
  const name = inv.partyName?.trim() ?? "Customer";
  return `${inv.invoiceNumber} · ${name}`;
}

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
  const [expensePayee, setExpensePayee] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [purchaseBillId, setPurchaseBillId] = useState<string>("");

  const parsedPurchaseBillId = useMemo(() => {
    const n = parseInt(purchaseBillId, 10);
    return Number.isFinite(n) ? n : undefined;
  }, [purchaseBillId]);

  const { data: purchaseBillDetail, isPending: purchaseBillDetailLoading } = useInvoice(
    category === "PARTY_PAYMENT" && parsedPurchaseBillId != null ? parsedPurchaseBillId : undefined,
  );
  const selectedPurchaseBill = purchaseBillDetail ?? null;

  const parsedReturnId = useMemo(() => {
    const n = parseInt(saleReturnId, 10);
    return Number.isFinite(n) ? n : undefined;
  }, [saleReturnId]);

  const { data: returnDetail, isPending: returnDetailLoading } = useInvoice(
    category === "SALE_RETURN_REFUND" && parsedReturnId != null ? parsedReturnId : undefined,
  );
  const selectedReturn = returnDetail ?? null;

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

  useEffect(() => {
    if (category !== "PARTY_PAYMENT" || !selectedPurchaseBill) return;
    const due = getInvoiceBalanceDue(selectedPurchaseBill);
    if (due > 0) setValue("amount", String(due));
  }, [category, selectedPurchaseBill?.id, selectedPurchaseBill, setValue]);

  useEffect(() => {
    setPurchaseBillId("");
  }, [party?.id]);

  const onCategoryChange = (c: OutboundPaymentCategory) => {
    setCategory(c);
    setParty(null);
    setSaleReturnId("");
    setExpensePayee("");
    setExpenseCategory("");
    setPurchaseBillId("");
    reset({ amount: "", paymentMethod: "BANK_TRANSFER", referenceNumber: "", notes: "" });
  };

  const onSubmit = async (data: BaseForm) => {
    try {
      if (category === "SALE_RETURN_REFUND") {
        if (!selectedReturn) {
          showErrorToast("Select a finalized sales return.");
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
          showErrorToast("Select a supplier.");
          return;
        }
        await createOutbound.mutateAsync({
          category: "PARTY_PAYMENT",
          partyId: party.id,
          ...(parsedPurchaseBillId != null ? { invoiceId: parsedPurchaseBillId } : {}),
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
      showSuccessToast("Payout recorded");
      router.push("/payments/outbound");
    } catch (e) {
      if (maybeShowTrialExpiredToast(e)) return;
      if (e instanceof ApiClientError) {
        showErrorToast(augmentApiClientErrorForPayment(e), "Failed to record payout");
      } else {
        showErrorToast(e, "Failed to record payout");
      }
    }
  };

  const linkingPurchasePending =
    category === "PARTY_PAYMENT" && parsedPurchaseBillId != null && purchaseBillDetailLoading;

  const linkingReturnPending =
    category === "SALE_RETURN_REFUND" && parsedReturnId != null && returnDetailLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-8">
      <div className="space-y-3">
        <Label required>Type</Label>
        <RadioGroup
          value={category}
          onValueChange={(v) => onCategoryChange(v as OutboundPaymentCategory)}
          className="grid gap-3 sm:grid-cols-3"
        >
          {OUTBOUND_CATEGORY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-card/50 p-4 text-sm shadow-sm transition-colors",
                category === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-border hover:bg-muted/40",
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
          <Label required>Sales return</Label>
          <p className="text-xs text-muted-foreground">
            Same idea as picking a party on an invoice: click the field, type to search, then choose
            a row. Finds finalized sales returns by return number or customer name.
          </p>
          <InvoiceLinkedCombobox
            invoiceType="SALE_RETURN"
            valueId={saleReturnId}
            onValueIdChange={setSaleReturnId}
            formatOption={saleReturnOptionLabel}
            displayLabel={returnDetail ? saleReturnOptionLabel(returnDetail) : null}
            placeholder="Search return no. or customer…"
            inputId="payout-sale-return-invoice"
          />
          {selectedReturn ? (
            <p className="text-xs text-muted-foreground">
              Total <span className="font-semibold tabular-nums">{selectedReturn.totalAmount}</span>
            </p>
          ) : null}
        </div>
      )}

      {category === "PARTY_PAYMENT" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label required>Supplier</Label>
            <PartyAutocomplete
              value={party}
              onValueChange={setParty}
              serverSearch
              partiesQueryType="SUPPLIER"
              placeholder="Search vendor…"
              inputId="payout-supplier-party"
            />
          </div>
          {party && (
            <div className="space-y-3">
              <Label>Purchase invoice (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Same as above: open the field, type to search. Only this supplier&apos;s purchase
                bills appear. Pick <span className="font-medium text-foreground">On account</span>{" "}
                to pay without linking a bill.
              </p>
              <InvoiceLinkedCombobox
                invoiceType="PURCHASE_INVOICE"
                partyId={party.id}
                valueId={purchaseBillId}
                onValueIdChange={setPurchaseBillId}
                noneOptionLabel="On account (not linked to a bill)"
                formatOption={purchaseInvoiceOptionLabel}
                displayLabel={
                  purchaseBillDetail ? purchaseInvoiceOptionLabel(purchaseBillDetail) : null
                }
                placeholder="Search purchase no. or vendor bill…"
                inputId="payout-purchase-invoice"
              />
              {linkingPurchasePending ? (
                <p className="text-xs text-muted-foreground">Loading invoice details…</p>
              ) : null}
              {selectedPurchaseBill ? (
                <p className="text-xs text-muted-foreground">
                  Balance due on this bill:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(String(getInvoiceBalanceDue(selectedPurchaseBill)))}
                  </span>
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {category === "EXPENSE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label required>Payee name</Label>
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
        <Label required>Amount</Label>
        <Input placeholder="0.00" {...register("amount")} aria-invalid={!!errors.amount} />
        {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
      </div>

      <div className="space-y-2">
        <Label required>Payment method</Label>
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

      <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/payments/outbound")}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createOutbound.isPending || linkingPurchasePending || linkingReturnPending}
        >
          {(createOutbound.isPending || linkingPurchasePending || linkingReturnPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Record payout
        </Button>
      </div>
    </form>
  );
}
