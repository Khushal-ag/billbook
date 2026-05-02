"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, FileText, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { OutboundDocumentPickerDialog } from "@/components/outbound-payments/OutboundDocumentPickerDialog";
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
import { formatCurrency, cn } from "@/lib/core/utils";

const baseSchema = z.object({
  amount: requiredPriceString,
  paymentMethod: z.enum(["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD"]),
  referenceNumber: optionalString,
  notes: optionalString,
});

type BaseForm = z.infer<typeof baseSchema>;

function amountStringForBalance(n: number): string {
  return n.toFixed(2);
}

export function OutboundPaymentCreateForm() {
  const router = useRouter();
  const [category, setCategory] = useState<OutboundPaymentCategory>("PARTY_PAYMENT");
  const [party, setParty] = useState<Party | null>(null);
  const [expensePayee, setExpensePayee] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");

  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    setParty(null);
    setLinkedInvoices([]);
    reset({ amount: "", paymentMethod: "BANK_TRANSFER", referenceNumber: "", notes: "" });
  }, [category, reset]);

  useEffect(() => {
    setLinkedInvoices([]);
  }, [party?.id]);

  const handlePickerConfirm = (invoices: Invoice[]) => {
    setLinkedInvoices(invoices);
    const sum = invoices.reduce((acc, inv) => acc + getInvoiceBalanceDue(inv), 0);
    setValue("amount", amountStringForBalance(sum), { shouldValidate: true, shouldDirty: true });
  };

  const openPicker = () => {
    if (category === "SALE_RETURN_REFUND" && !party) {
      showErrorToast("Select a customer first.");
      return;
    }
    if (category === "PARTY_PAYMENT" && !party) {
      showErrorToast("Select a vendor first.");
      return;
    }
    setPickerOpen(true);
  };

  const singleLinked = linkedInvoices.length === 1;
  const multipleLinked = linkedInvoices.length > 1;
  const amountReadOnly =
    multipleLinked && (category === "SALE_RETURN_REFUND" || category === "PARTY_PAYMENT");

  const onSubmit = async (data: BaseForm) => {
    try {
      if (category === "SALE_RETURN_REFUND") {
        if (!party) {
          showErrorToast("Select a customer.");
          return;
        }
        if (linkedInvoices.length === 0) {
          showErrorToast("Choose one or more sales returns with balance.");
          return;
        }
        let count = 0;
        for (const inv of linkedInvoices) {
          const due = getInvoiceBalanceDue(inv);
          const amountStr = linkedInvoices.length === 1 ? data.amount : amountStringForBalance(due);
          await createOutbound.mutateAsync({
            category: "SALE_RETURN_REFUND",
            partyId: inv.partyId,
            invoiceId: inv.id,
            amount: amountStr,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber || undefined,
            notes: data.notes || undefined,
          });
          count++;
        }
        showSuccessToast(count > 1 ? `Recorded ${count} payments` : "Payment recorded");
        router.push("/payments/outbound");
        return;
      }

      if (category === "PARTY_PAYMENT") {
        if (!party) {
          showErrorToast("Select a vendor.");
          return;
        }
        if (linkedInvoices.length === 0) {
          await createOutbound.mutateAsync({
            category: "PARTY_PAYMENT",
            partyId: party.id,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber || undefined,
            notes: data.notes || undefined,
          });
          showSuccessToast("Payment recorded");
          router.push("/payments/outbound");
          return;
        }
        let count = 0;
        for (const inv of linkedInvoices) {
          const due = getInvoiceBalanceDue(inv);
          const amountStr = linkedInvoices.length === 1 ? data.amount : amountStringForBalance(due);
          await createOutbound.mutateAsync({
            category: "PARTY_PAYMENT",
            partyId: party.id,
            invoiceId: inv.id,
            amount: amountStr,
            paymentMethod: data.paymentMethod,
            referenceNumber: data.referenceNumber || undefined,
            notes: data.notes || undefined,
          });
          count++;
        }
        showSuccessToast(count > 1 ? `Recorded ${count} payments` : "Payment recorded");
        router.push("/payments/outbound");
        return;
      }

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
      showSuccessToast("Payment recorded");
      router.push("/payments/outbound");
    } catch (e) {
      if (maybeShowTrialExpiredToast(e)) return;
      if (e instanceof ApiClientError) {
        showErrorToast(augmentApiClientErrorForPayment(e), "Couldn't record payment");
      } else {
        showErrorToast(e, "Couldn't record payment");
      }
    }
  };

  const payeeLabel =
    category === "SALE_RETURN_REFUND" ? "Customer" : category === "PARTY_PAYMENT" ? "Vendor" : null;

  const pickerMode =
    category === "SALE_RETURN_REFUND"
      ? ("SALE_RETURN" as const)
      : category === "PARTY_PAYMENT"
        ? ("PURCHASE_INVOICE" as const)
        : null;

  const linkedSummary =
    linkedInvoices.length > 0
      ? `${linkedInvoices.length} document${linkedInvoices.length === 1 ? "" : "s"} · ${formatCurrency(
          linkedInvoices.reduce((acc, inv) => acc + getInvoiceBalanceDue(inv), 0).toFixed(2),
        )} balance total`
      : null;

  return (
    <>
      {pickerMode ? (
        <OutboundDocumentPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          mode={pickerMode}
          partyId={party?.id ?? null}
          partyNameHint={party?.name ?? null}
          onConfirm={handlePickerConfirm}
        />
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-xl space-y-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
              1
            </span>
            Type
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm ring-1 ring-border/30">
            <Label htmlFor="payment-type" className="mb-2 block">
              Payment type
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as OutboundPaymentCategory)}
            >
              <SelectTrigger id="payment-type" className="h-11 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTBOUND_CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
              2
            </span>
            {category === "EXPENSE" ? "Payee" : "Party & documents"}
          </div>

          {category === "EXPENSE" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-payee" required>
                  Payee name
                </Label>
                <Input
                  id="expense-payee"
                  placeholder="Who received the payment"
                  value={expensePayee}
                  onChange={(e) => setExpensePayee(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-category">Expense category</Label>
                <Input
                  id="expense-category"
                  placeholder="Optional"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label required className="inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  {payeeLabel}
                </Label>
                <PartyAutocomplete
                  value={party}
                  onValueChange={setParty}
                  serverSearch
                  partiesQueryType={category === "SALE_RETURN_REFUND" ? "CUSTOMER" : "SUPPLIER"}
                  placeholder={
                    category === "SALE_RETURN_REFUND" ? "Search customer…" : "Search vendor…"
                  }
                  inputId="payout-party"
                />
              </div>

              <div className="space-y-3 rounded-xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent px-4 py-4 ring-1 ring-primary/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
                  {category === "SALE_RETURN_REFUND"
                    ? "Link sales returns"
                    : "Link purchase bills (optional)"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start gap-2 border-primary/20 bg-background/80 py-3 text-left font-medium text-primary shadow-sm hover:bg-primary/5 sm:w-auto"
                  onClick={openPicker}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>
                    {category === "SALE_RETURN_REFUND"
                      ? "Browse sales returns for this customer"
                      : "Browse purchase bills for this vendor"}
                  </span>
                </Button>
                {linkedSummary ? (
                  <p className="rounded-md bg-background/80 px-3 py-2 text-sm font-medium text-foreground ring-1 ring-border/60">
                    {linkedSummary}
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {category === "PARTY_PAYMENT"
                      ? "Skip this to record an on-account payment — enter the amount below."
                      : "Open the list, tick returns with a balance, then Select — the amount field updates automatically."}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
              3
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-muted-foreground" aria-hidden />
              Payment
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-amount" required>
              Amount
            </Label>
            <Input
              id="payout-amount"
              placeholder="0.00"
              readOnly={amountReadOnly}
              className={cn(amountReadOnly && "bg-muted/60")}
              {...register("amount")}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <FieldError>{errors.amount.message}</FieldError>}
            {multipleLinked && category !== "EXPENSE" ? (
              <p className="text-xs text-muted-foreground">
                Each selected document is recorded as its own payment for the row&apos;s balance.
                This total matches the sum of those balances.
              </p>
            ) : singleLinked && category !== "EXPENSE" ? (
              <p className="text-xs text-muted-foreground">
                You can adjust the amount for a single linked document (e.g. partial payment).
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-method" required>
              Payment method
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) =>
                setValue("paymentMethod", v as PaymentMethod, { shouldDirty: true })
              }
            >
              <SelectTrigger id="payout-method">
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
            <Label htmlFor="payout-reference">Reference</Label>
            <Input
              id="payout-reference"
              placeholder="UTR / cheque no."
              {...register("referenceNumber")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-notes">Notes</Label>
            <Textarea id="payout-notes" rows={3} {...register("notes")} />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-8 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/payments/outbound")}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="min-w-[160px] shadow-sm"
            disabled={createOutbound.isPending}
          >
            {createOutbound.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record payment
          </Button>
        </div>
      </form>
    </>
  );
}
