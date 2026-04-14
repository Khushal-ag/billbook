import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateCreditNote, useCreditNotes } from "@/hooks/use-credit-notes";
import { useInvoices, useInvoice } from "@/hooks/use-invoices";
import type { Invoice } from "@/types/invoice";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { withInvoiceQuantityErrorDetails } from "@/lib/invoice-quantity-error-details";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/trial";

const schema = z.object({
  invoiceId: z.coerce.number().min(1, "Select a document"),
  amount: requiredPriceString,
  reason: optionalString,
});

type FormData = z.infer<typeof schema>;

function sumFinalCreditOnInvoice(
  creditNotes: { invoiceId: number; amount: string; status: string; deletedAt: string | null }[],
  invoiceId: number,
): number {
  let s = 0;
  for (const cn of creditNotes) {
    if (cn.invoiceId !== invoiceId || cn.deletedAt != null) continue;
    if (cn.status !== "FINAL") continue;
    s += parseFloat(cn.amount) || 0;
  }
  return s;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInvoiceId?: number;
}

export default function CreditNoteDialog({ open, onOpenChange, defaultInvoiceId }: Props) {
  const router = useRouter();
  const mutation = useCreateCreditNote();
  const lastPrefilledInvoiceId = useRef<number | null>(null);

  const { data: returnInvoicesData, isPending: returnInvoicesPending } = useInvoices({
    status: "FINAL",
    invoiceType: "SALE_RETURN",
    page: 1,
    pageSize: 200,
    enabled: open,
  });

  const { data: saleInvoicesData, isPending: saleInvoicesPending } = useInvoices({
    status: "FINAL",
    invoiceType: "SALE_INVOICE",
    page: 1,
    pageSize: 200,
    enabled: open,
  });

  const { data: existingCreditNotesData, isPending: creditNotesListPending } = useCreditNotes({
    page: 1,
    pageSize: 500,
    enabled: open,
  });

  const invoices = useMemo(() => {
    const m = new Map<number, Invoice>();
    for (const inv of returnInvoicesData?.invoices ?? []) {
      m.set(inv.id, inv);
    }
    for (const inv of saleInvoicesData?.invoices ?? []) {
      m.set(inv.id, inv);
    }
    return [...m.values()].sort((a, b) =>
      String(a.invoiceNumber).localeCompare(String(b.invoiceNumber), undefined, {
        numeric: true,
      }),
    );
  }, [returnInvoicesData?.invoices, saleInvoicesData?.invoices]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: defaultInvoiceId ?? 0,
      amount: "",
      reason: "",
    },
  });

  const watchedInvoiceId = watch("invoiceId");
  const { data: invoiceDetail, isPending: invoiceDetailPending } = useInvoice(
    watchedInvoiceId > 0 ? watchedInvoiceId : undefined,
  );

  useEffect(() => {
    if (!open) return;
    const defaultId = defaultInvoiceId ?? 0;
    const pick =
      defaultId > 0 && invoices.some((i) => i.id === defaultId)
        ? defaultId
        : (invoices[0]?.id ?? 0);
    reset({
      invoiceId: pick,
      amount: "",
      reason: "",
    });
    lastPrefilledInvoiceId.current = null;
  }, [open, defaultInvoiceId, reset, invoices]);

  const selectedInvoice = invoices.find((inv) => inv.id === watchedInvoiceId);
  const invoiceTotal = parseFloat(selectedInvoice?.totalAmount ?? "0") || 0;
  const invoicePaid = parseFloat(selectedInvoice?.paidAmount ?? "0") || 0;
  const invoiceDue = Math.max(0, invoiceTotal - invoicePaid);

  const existingOnSource = useMemo(
    () => sumFinalCreditOnInvoice(existingCreditNotesData?.creditNotes ?? [], watchedInvoiceId),
    [existingCreditNotesData?.creditNotes, watchedInvoiceId],
  );

  const maxNewAmount = Math.max(0, invoiceTotal - existingOnSource);

  useEffect(() => {
    if (dirtyFields.amount) return;
    lastPrefilledInvoiceId.current = null;
  }, [existingOnSource, watchedInvoiceId, dirtyFields.amount]);

  useEffect(() => {
    if (!open || watchedInvoiceId <= 0) return;
    if (creditNotesListPending) return;
    if (!invoiceDetail || invoiceDetail.id !== watchedInvoiceId) return;
    if (lastPrefilledInvoiceId.current === watchedInvoiceId) return;

    const t = invoiceDetail.totalAmount?.trim();
    if (!t) return;

    if (invoiceDetail.invoiceType === "SALE_RETURN") {
      const capped = Math.min(parseFloat(t) || 0, maxNewAmount).toFixed(2);
      setValue("amount", capped, { shouldDirty: false });
      lastPrefilledInvoiceId.current = watchedInvoiceId;
    } else if (invoiceDetail.invoiceType === "SALE_INVOICE") {
      setValue("amount", maxNewAmount > 0 ? maxNewAmount.toFixed(2) : "", { shouldDirty: false });
      lastPrefilledInvoiceId.current = watchedInvoiceId;
    }
  }, [open, watchedInvoiceId, invoiceDetail, setValue, maxNewAmount, creditNotesListPending]);

  const onSubmit = async (data: FormData) => {
    const amt = parseFloat(data.amount) || 0;
    if (selectedInvoice && amt > maxNewAmount + 0.01) {
      showErrorToast(
        `Amount cannot exceed remaining headroom on this document (${maxNewAmount.toFixed(2)}); existing final credit notes already total ${existingOnSource.toFixed(2)} against ${selectedInvoice.totalAmount}.`,
      );
      return;
    }

    try {
      const created = await mutation.mutateAsync({
        invoiceId: data.invoiceId,
        amount: data.amount,
        reason: data.reason || undefined,
      });
      onOpenChange(false);
      showSuccessToast("Credit note created.");
      router.push(`/credit-notes/${created.id}#credit-note-allocate`);
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      showErrorToast(withInvoiceQuantityErrorDetails(err), "Failed to create credit note");
    }
  };

  const listPending = returnInvoicesPending || saleInvoicesPending || creditNotesListPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New credit note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label required>Source document</Label>
            <Select
              value={watch("invoiceId") > 0 ? String(watch("invoiceId")) : ""}
              onValueChange={(v) => {
                lastPrefilledInvoiceId.current = null;
                setValue("invoiceId", Number(v));
              }}
            >
              <SelectTrigger disabled={invoices.length === 0 || listPending}>
                <SelectValue
                  placeholder={
                    listPending
                      ? "Loading…"
                      : invoices.length === 0
                        ? "No eligible documents"
                        : "Select invoice or return"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {invoices.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No final sale invoices or sales returns found. Create and finalise a document
                    first.
                  </div>
                ) : (
                  invoices.map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      {inv.invoiceNumber} — {inv.invoiceType === "SALE_RETURN" ? "Return" : "Sale"}{" "}
                      — {inv.partyName?.trim() || "Unknown party"}
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
                Document total: {selectedInvoice.totalAmount}
                {selectedInvoice.invoiceType === "SALE_INVOICE" &&
                  ` — Balance due: ${invoiceDue.toFixed(2)}`}
                {" — "}
                Final credit notes already on this document: {existingOnSource.toFixed(2)}. Max this
                note: {maxNewAmount.toFixed(2)}.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea rows={2} {...register("reason")} />
          </div>

          {watchedInvoiceId > 0 && invoiceDetailPending ? (
            <p className="text-xs text-muted-foreground">Loading document details…</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                mutation.isPending ||
                watch("invoiceId") <= 0 ||
                invoices.length === 0
              }
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create credit note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
