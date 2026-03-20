"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import PartyDialog from "@/components/dialogs/PartyDialog";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { useCreateReceipt } from "@/hooks/use-receipts";
import { PAYMENT_METHOD_OPTIONS } from "@/constants";
import type { PaymentMethod } from "@/types/invoice";
import type { Party } from "@/types/party";
import { requiredPriceString, optionalString } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import { isEventFromNestedPortal } from "@/lib/dialog-nested-portal";

const schema = z.object({
  totalAmount: requiredPriceString,
  paymentMethod: z.enum(["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD"]),
  referenceNumber: optionalString,
  notes: optionalString,
});

type FormData = z.infer<typeof schema>;

interface NewReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewReceiptDialog({ open, onOpenChange }: NewReceiptDialogProps) {
  const [party, setParty] = useState<Party | null>(null);
  const [partyError, setPartyError] = useState(false);
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);
  const [pendingPartyName, setPendingPartyName] = useState("");

  const createReceipt = useCreateReceipt();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalAmount: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setPartyDialogOpen(false);
      setPendingPartyName("");
      return;
    }
    setParty(null);
    setPartyError(false);
    setPartyDialogOpen(false);
    setPendingPartyName("");
    reset({
      totalAmount: "",
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    });
  }, [open, reset]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setParty(null);
      setPartyError(false);
    }
    onOpenChange(next);
  };

  const onSubmit = async (data: FormData) => {
    if (!party) {
      setPartyError(true);
      return;
    }
    setPartyError(false);
    try {
      await createReceipt.mutateAsync({
        partyId: party.id,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod as PaymentMethod,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
      });
      showSuccessToast("Receipt created");
      handleClose(false);
    } catch (e) {
      showErrorToast(e, "Failed to create receipt");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => {
            if (isEventFromNestedPortal(e.target)) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (isEventFromNestedPortal(e.target)) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>New receipt</DialogTitle>
            <DialogDescription>
              Record money received from a party. You can allocate it to invoices afterwards.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Party *</Label>
              <PartyAutocomplete
                value={party}
                onValueChange={(p) => {
                  setParty(p);
                  if (p) setPartyError(false);
                }}
                serverSearch
                partiesQueryType="CUSTOMER"
                placeholder="Search customer…"
                inDialog
                onAddParty={(_onCreated, draft) => {
                  setPendingPartyName((draft ?? "").trim());
                  setPartyDialogOpen(true);
                }}
                addLabel="Add customer"
              />
              {partyError && (
                <p className="text-xs text-destructive">Select a party to continue.</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input placeholder="0.00" {...register("totalAmount")} />
                {errors.totalAmount && (
                  <p className="text-xs text-destructive">{errors.totalAmount.message}</p>
                )}
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
            </div>

            <div className="space-y-2">
              <Label>Reference number</Label>
              <Input placeholder="e.g. cheque / UPI ref" {...register("referenceNumber")} />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Optional" {...register("notes")} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReceipt.isPending}>
                {createReceipt.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <PartyDialog
        open={open && partyDialogOpen}
        onOpenChange={(o) => {
          setPartyDialogOpen(o);
          if (!o) setPendingPartyName("");
        }}
        initialName={pendingPartyName}
        defaultType="CUSTOMER"
        typeLocked
        onSuccess={(p) => {
          setParty(p);
          setPartyError(false);
          setPartyDialogOpen(false);
          setPendingPartyName("");
        }}
      />
    </>
  );
}
