"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";

interface SummaryShape {
  subTotal: number;
  lineDiscountTotal: number;
  taxableTotal: number;
  invoiceDiscount: number;
  taxTotal: number;
  taxPercent: number;
  roundOff: number;
  grandTotal: number;
}

interface InvoiceTotalsSummaryProps {
  summaryTitle: string;
  summary: SummaryShape;
  /** When true, round-off is signed (+ up / − down). When false, manual field is always an amount subtracted from the bill. */
  autoRoundOff: boolean;
  onAutoRoundOffChange: (checked: boolean) => void;
  roundOffInputValue: string;
  onRoundOffAmountChange: (value: string) => void;
  canSubmit: boolean;
  isPending: boolean;
  onCreate: () => void;
  shortLabel: string;
  /** Default: Create {shortLabel} */
  submitLabel?: string;
}

export function InvoiceTotalsSummary({
  summaryTitle,
  summary,
  autoRoundOff,
  onAutoRoundOffChange,
  roundOffInputValue,
  onRoundOffAmountChange,
  canSubmit,
  isPending,
  onCreate,
  shortLabel,
  submitLabel,
}: InvoiceTotalsSummaryProps) {
  const {
    subTotal,
    lineDiscountTotal,
    taxableTotal,
    invoiceDiscount,
    taxTotal,
    taxPercent,
    roundOff,
    grandTotal,
  } = summary;

  const subtotalBeforeRoundOff = Math.max(0, taxableTotal + taxTotal - invoiceDiscount);
  const showLineDiscount = lineDiscountTotal > 0.000_5;
  const showInvoiceDiscount = invoiceDiscount > 0.000_5;
  const showRoundOffLine = Math.abs(roundOff) > 0.000_5;
  const taxLabel =
    taxableTotal > 0.000_5 || taxTotal > 0.000_5
      ? `Total tax (${taxPercent.toFixed(2)}%)`
      : "Total tax";

  return (
    <div className="flex justify-end">
      <div className="w-full max-w-[360px] space-y-2">
        <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Tax is calculated per line on taxable value after item discounts. The % shown is the
          effective rate on total taxable amount; it is approximate when lines use different tax
          rates.
        </div>
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">{summaryTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Gross amount</span>
              <span className="tabular-nums">{formatCurrency(subTotal)}</span>
            </div>
            {showLineDiscount && (
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>Item discount</span>
                <span className="tabular-nums">−{formatCurrency(lineDiscountTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-dashed pt-2">
              <span className="font-medium text-foreground">Taxable amount</span>
              <span className="font-medium tabular-nums">{formatCurrency(taxableTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{taxLabel}</span>
              <span className="shrink-0 tabular-nums">{formatCurrency(taxTotal)}</span>
            </div>
            {showInvoiceDiscount && (
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>Invoice discount</span>
                <span className="tabular-nums">−{formatCurrency(invoiceDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-dashed pt-2 text-muted-foreground">
              <span>Subtotal (before round-off)</span>
              <span className="tabular-nums">{formatCurrency(subtotalBeforeRoundOff)}</span>
            </div>

            <div className="space-y-2 rounded-md border bg-muted/20 p-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autoRoundOff"
                  checked={autoRoundOff}
                  onCheckedChange={(v) => onAutoRoundOffChange(!!v)}
                />
                <Label htmlFor="autoRoundOff" className="cursor-pointer text-xs font-normal">
                  Auto round-off
                </Label>
              </div>
              <div className="grid grid-cols-[1fr_120px] items-center gap-2">
                <span className="text-muted-foreground">Round Off / Discount</span>
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className="min-w-[0.65rem] text-right tabular-nums text-muted-foreground"
                    title={
                      autoRoundOff
                        ? "Auto: + rounds up to nearest rupee, − rounds down"
                        : "Manual: amount is subtracted from the bill total"
                    }
                  >
                    {autoRoundOff
                      ? Math.abs(roundOff) < 0.000_5
                        ? ""
                        : roundOff > 0
                          ? "+"
                          : "−"
                      : "−"}
                  </span>
                  <Input
                    value={roundOffInputValue}
                    disabled={autoRoundOff}
                    onChange={(e) => onRoundOffAmountChange(e.target.value.replace(/^\s*[-+]/, ""))}
                    className="h-8 text-right tabular-nums"
                  />
                </div>
              </div>
            </div>

            {showRoundOffLine && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Round-off applied</span>
                <span className="tabular-nums">{formatSignedCurrency(roundOff)}</span>
              </div>
            )}

            <div className="my-2 border-t" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Payable Amount</span>
              <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
            </div>
            <Button className="mt-3 w-full" disabled={!canSubmit || isPending} onClick={onCreate}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel ?? `Create ${shortLabel}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
