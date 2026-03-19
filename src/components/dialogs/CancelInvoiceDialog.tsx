"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CANCEL_INVOICE_REASON_MAX,
  INVOICE_CANCEL_OTHER_ID,
  INVOICE_CANCEL_PRESET_REASONS,
  validateCancelInvoiceReason,
} from "@/constants/invoice-cancel";

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  isPending?: boolean;
}

export default function CancelInvoiceDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: CancelInvoiceDialogProps) {
  const [presetId, setPresetId] = useState<string>("");
  const [otherText, setOtherText] = useState("");

  useEffect(() => {
    if (open) {
      setPresetId("");
      setOtherText("");
    }
  }, [open]);

  const resolvedReason = useMemo(() => {
    if (!presetId) return "";
    if (presetId === INVOICE_CANCEL_OTHER_ID) return otherText.trim();
    const row = INVOICE_CANCEL_PRESET_REASONS.find((p) => p.id === presetId);
    return row?.reason ?? "";
  }, [presetId, otherText]);

  const validationError = useMemo(() => {
    if (!presetId) return "Select a reason.";
    if (presetId === INVOICE_CANCEL_OTHER_ID && !otherText.trim()) {
      return "Enter a reason (at least 3 characters).";
    }
    return validateCancelInvoiceReason(resolvedReason);
  }, [presetId, otherText, resolvedReason]);

  const canSubmit = validationError === null;

  const handleSubmit = async () => {
    if (!canSubmit || isPending) return;
    await onConfirm(resolvedReason);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel invoice</AlertDialogTitle>
          <AlertDialogDescription>
            This draft will be cancelled. The server requires a short reason for the audit trail.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason-preset">Reason</Label>
            <Select value={presetId || undefined} onValueChange={setPresetId}>
              <SelectTrigger id="cancel-reason-preset" className="w-full">
                <SelectValue placeholder="Choose a reason…" />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_CANCEL_PRESET_REASONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value={INVOICE_CANCEL_OTHER_ID}>Other (describe below)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {presetId === INVOICE_CANCEL_OTHER_ID && (
            <div className="space-y-2">
              <Label htmlFor="cancel-reason-other">Details</Label>
              <Textarea
                id="cancel-reason-other"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value.slice(0, CANCEL_INVOICE_REASON_MAX))}
                placeholder="Why is this invoice being cancelled? (3–2000 characters)"
                rows={4}
                className="min-h-[100px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {otherText.trim().length} / {CANCEL_INVOICE_REASON_MAX} characters
              </p>
            </div>
          )}

          {validationError && (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Back</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Cancelling…" : "Cancel invoice"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
