"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvoiceBillSummary, getInvoiceTypeCreateCopy } from "@/lib/invoice";
import { formatInvoicePartyAddressLines } from "@/lib/party-address-display";
import { cn, formatCurrency, formatDate, formatSignedCurrency, formatTime } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";
import { useInvoice } from "@/hooks/use-invoices";

interface InvoiceDetailsCardsProps {
  invoice: InvoiceDetail;
}

const EPS = 0.000_5;

function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 text-sm", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right font-medium text-foreground">{children}</div>
    </div>
  );
}

export function InvoiceDetailsCards({ invoice }: InvoiceDetailsCardsProps) {
  const summaryTitle = getInvoiceTypeCreateCopy(invoice.invoiceType).summaryTitle;
  const bill = getInvoiceBillSummary(invoice);
  const partyAddressText = formatInvoicePartyAddressLines(invoice);
  const addressLabel = invoice.addressRoleLabel || "Party address";

  const sourceId = invoice.sourceInvoiceId;
  const isReturnWithSource =
    (invoice.invoiceType === "SALE_RETURN" || invoice.invoiceType === "PURCHASE_RETURN") &&
    sourceId != null;
  const embeddedSourceNumber = invoice.sourceInvoiceNumber?.trim();
  const { data: sourceInvoice, isPending: sourceInvoicePending } = useInvoice(
    isReturnWithSource && !embeddedSourceNumber ? sourceId : undefined,
  );
  const sourceInvoiceNumber = embeddedSourceNumber || sourceInvoice?.invoiceNumber?.trim();

  const showLineDiscount = bill.lineDiscountTotal > EPS;
  const showInvoiceDiscount = bill.invoiceDiscount > EPS;
  const taxLabel =
    bill.taxableTotal > EPS || bill.taxTotal > EPS
      ? `Total tax (${bill.taxPercentEffective.toFixed(2)}%)`
      : "Total tax";

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Notes &amp; details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4 text-sm">
          {isReturnWithSource ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Linked document
              </p>
              <div className="rounded-md border bg-muted/15 px-3 py-2.5">
                <Link
                  href={`/invoices/${sourceId}`}
                  className="text-sm font-medium text-primary hover:underline"
                  title="Original invoice"
                >
                  {sourceInvoiceNumber
                    ? sourceInvoiceNumber
                    : sourceInvoicePending
                      ? "Loading…"
                      : "Original invoice"}
                </Link>
              </div>
            </div>
          ) : null}

          {invoice.invoiceType === "PURCHASE_INVOICE" &&
          invoice.sellingPriceMarginPercent != null &&
          String(invoice.sellingPriceMarginPercent).trim() !== "" ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Purchase pricing
              </p>
              <div className="rounded-md border bg-muted/15 px-3 py-2.5">
                <DetailRow label="Selling margin (effective)">
                  <span className="tabular-nums">
                    {String(invoice.sellingPriceMarginPercent).trim()}%
                  </span>
                </DetailRow>
              </div>
            </div>
          ) : null}

          {invoice.notes ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Notes
              </p>
              <div className="rounded-md border border-dashed bg-muted/10 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                {invoice.notes}
              </div>
            </div>
          ) : null}

          {partyAddressText ? (
            <div className={cn("space-y-2", invoice.notes ? "border-t pt-4" : "")}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {addressLabel}
              </p>
              <div className="whitespace-pre-line rounded-md border bg-muted/15 px-3 py-2.5 text-sm leading-relaxed text-foreground">
                {partyAddressText}
              </div>
            </div>
          ) : null}

          <div
            className={cn("space-y-2", invoice.notes || partyAddressText ? "border-t pt-4" : "")}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Record
            </p>
            <div className="space-y-2 rounded-md border bg-muted/15 p-3">
              <DetailRow label="Created">
                <span className="text-xs tabular-nums sm:text-sm">
                  {formatDate(invoice.createdAt)} · {formatTime(invoice.createdAt)}
                </span>
              </DetailRow>
              <DetailRow label="Updated">
                <span className="text-xs tabular-nums sm:text-sm">
                  {formatDate(invoice.updatedAt)} · {formatTime(invoice.updatedAt)}
                </span>
              </DetailRow>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">{summaryTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-2 text-sm">
          <div className="flex flex-1 flex-col space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Gross amount</span>
              <span className="tabular-nums">{formatCurrency(bill.grossAmount)}</span>
            </div>
            {showLineDiscount && (
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>Item discount</span>
                <span className="tabular-nums">−{formatCurrency(bill.lineDiscountTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-dashed pt-2">
              <span className="font-medium text-foreground">Taxable amount</span>
              <span className="font-medium tabular-nums">{formatCurrency(bill.taxableTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{taxLabel}</span>
              <span className="shrink-0 tabular-nums">{formatCurrency(bill.taxTotal)}</span>
            </div>
            {showInvoiceDiscount && (
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>Invoice discount</span>
                <span className="tabular-nums">−{formatCurrency(bill.invoiceDiscount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-dashed pt-2 text-muted-foreground">
              <span>Subtotal (before round-off)</span>
              <span className="tabular-nums">{formatCurrency(bill.subtotalBeforeRoundOff)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
              <span className="text-muted-foreground">Round off / discount</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatSignedCurrency(bill.roundOff)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
