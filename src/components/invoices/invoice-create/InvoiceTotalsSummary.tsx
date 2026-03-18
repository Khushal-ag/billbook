"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface SummaryShape {
  subTotal: number;
  lineDiscountTotal: number;
  invoiceDiscount: number;
  taxTotal: number;
  taxPercent: number;
  roundOff: number;
  grandTotal: number;
}

interface InvoiceTotalsSummaryProps {
  summaryTitle: string;
  summary: SummaryShape;
  autoRoundOff: boolean;
  onAutoRoundOffChange: (checked: boolean) => void;
  roundOffInputValue: string;
  onRoundOffAmountChange: (value: string) => void;
  canSubmit: boolean;
  isPending: boolean;
  onCreate: () => void;
  shortLabel: string;
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
}: InvoiceTotalsSummaryProps) {
  return (
    <div className="flex justify-end">
      <div className="w-full max-w-[360px] space-y-2">
        <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          GST note: tax is calculated per product or service on taxable amount after discount.
        </div>
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">{summaryTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(summary.subTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Item Discount</span>
              <span>- {formatCurrency(summary.lineDiscountTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bill Discount</span>
              <span>- {formatCurrency(summary.invoiceDiscount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax ({summary.taxPercent.toFixed(2)}%)</span>
              <span>{formatCurrency(summary.taxTotal)}</span>
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
                <span className="text-muted-foreground">Round Off</span>
                <Input
                  value={roundOffInputValue}
                  disabled={autoRoundOff}
                  onChange={(e) => onRoundOffAmountChange(e.target.value)}
                  className="h-8 text-right tabular-nums"
                />
              </div>
            </div>
            <div className="my-2 border-t" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total Amount</span>
              <span>{formatCurrency(summary.grandTotal)}</span>
            </div>
            <Button className="mt-3 w-full" disabled={!canSubmit || isPending} onClick={onCreate}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create {shortLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
