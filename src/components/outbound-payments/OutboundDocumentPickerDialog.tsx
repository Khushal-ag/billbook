"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useInvoices } from "@/hooks/use-invoices";
import { getInvoiceBalanceDue } from "@/lib/invoice/invoice";
import { formatCurrency, formatDate } from "@/lib/core/utils";
import type { Invoice, InvoiceType } from "@/types/invoice";

export type OutboundDocumentPickerMode = Extract<InvoiceType, "SALE_RETURN" | "PURCHASE_INVOICE">;

export interface OutboundDocumentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: OutboundDocumentPickerMode;
  /** Required to load documents for this party (customer or vendor). */
  partyId: number | null;
  partyNameHint?: string | null;
  /** Called with selected finalized invoices (balance &gt; 0). */
  onConfirm: (invoices: Invoice[]) => void;
}

export function OutboundDocumentPickerDialog({
  open,
  onOpenChange,
  mode,
  partyId,
  partyNameHint,
  onConfirm,
}: OutboundDocumentPickerDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const queryEnabled = open && partyId != null && Number.isFinite(partyId);

  const { data, isPending, isFetching } = useInvoices({
    page: 1,
    pageSize: 100,
    invoiceType: mode,
    status: "FINAL",
    partyId: partyId ?? undefined,
    enabled: queryEnabled,
    keepPreviousWhileFetching: true,
  });

  const rows = useMemo(() => {
    const list = data?.invoices ?? [];
    return list.filter((inv) => getInvoiceBalanceDue(inv) > 0);
  }, [data?.invoices]);

  useEffect(() => {
    if (!open) setSelectedIds(new Set());
  }, [open, mode, partyId]);

  const selectedTotal = useMemo(() => {
    let sum = 0;
    for (const inv of rows) {
      if (selectedIds.has(inv.id)) sum += getInvoiceBalanceDue(inv);
    }
    return sum;
  }, [rows, selectedIds]);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllPage = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(rows.map((r) => r.id)));
  };

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const handleConfirm = () => {
    const picked = rows.filter((inv) => selectedIds.has(inv.id));
    if (picked.length === 0) return;
    onConfirm(picked);
    onOpenChange(false);
  };

  const loading = isPending || isFetching;

  const title =
    mode === "SALE_RETURN" ? "Sales returns with balance" : "Purchase bills with balance";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          {partyNameHint?.trim() ? (
            <p className="text-sm text-muted-foreground">{partyNameHint.trim()}</p>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          {!partyId ? (
            <p className="text-sm text-muted-foreground">
              Select {mode === "SALE_RETURN" ? "a customer" : "a vendor"} first, then open this
              list.
            </p>
          ) : loading && rows.length === 0 ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No finalized documents with an outstanding balance for this party.
            </p>
          ) : (
            <div className="rounded-lg border border-border/80">
              <div className="data-table-container max-h-[min(52vh,420px)] overflow-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="w-10 px-3 py-2.5 text-left">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(v) => toggleAllPage(v === true)}
                          aria-label="Select all rows"
                          className="border-border"
                        />
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                        Invoice no.
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((inv) => {
                      const due = getInvoiceBalanceDue(inv);
                      return (
                        <tr
                          key={inv.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-3 py-2.5">
                            <Checkbox
                              checked={selectedIds.has(inv.id)}
                              onCheckedChange={() => toggleId(inv.id)}
                              aria-label={`Select ${inv.invoiceNumber}`}
                              className="border-border"
                            />
                          </td>
                          <td className="px-3 py-2.5 font-medium tabular-nums">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {formatDate(inv.invoiceDate)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-rose-700">
                            {formatCurrency(String(due))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/25">
                      <td
                        colSpan={3}
                        className="px-3 py-3 text-right font-semibold text-foreground"
                      >
                        Total (selected)
                      </td>
                      <td className="px-3 py-3 text-right text-base font-bold tabular-nums text-foreground">
                        {formatCurrency(selectedTotal.toFixed(2))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!someSelected}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
