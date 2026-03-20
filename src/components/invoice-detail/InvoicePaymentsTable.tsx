"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openSignedPdfFromApiPath } from "@/lib/signed-pdf";
import {
  normalizeInvoicePaymentLine,
  type InvoicePaymentLine,
  type LegacyInvoicePayment,
} from "@/types/invoice";

const METHOD_STYLES: Record<string, string> = {
  CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPI: "bg-blue-50 text-blue-700 border-blue-200",
  CHEQUE: "bg-amber-50 text-amber-700 border-amber-200",
  BANK_TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
  CARD: "bg-sky-50 text-sky-700 border-sky-200",
};

function sourceLabel(line: InvoicePaymentLine): string {
  switch (line.source) {
    case "RECEIPT_ALLOCATION":
      return "Receipt";
    case "OUTBOUND_REFUND":
      return "Refund";
    default:
      return "Payment";
  }
}

function sourceBadgeClass(line: InvoicePaymentLine): string {
  switch (line.source) {
    case "RECEIPT_ALLOCATION":
      return "bg-violet-50 text-violet-800 border-violet-200";
    case "OUTBOUND_REFUND":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

interface InvoicePaymentsTableProps {
  payments: (LegacyInvoicePayment | InvoicePaymentLine)[];
}

export function InvoicePaymentsTable({ payments }: InvoicePaymentsTableProps) {
  const lines = payments.map((p) => normalizeInvoicePaymentLine(p));
  if (lines.length === 0) return null;

  const applied = lines
    .filter((p) => p.source !== "OUTBOUND_REFUND")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const refunded = lines
    .filter((p) => p.source === "OUTBOUND_REFUND")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Payments & receipts
          </CardTitle>
          {lines.length > 1 && (
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-semibold tabular-nums text-emerald-600">
                Applied {formatCurrency(applied)}
              </span>
              {refunded > 0 && (
                <span className="font-semibold tabular-nums text-rose-600">
                  Refunded {formatCurrency(refunded)}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="data-table-container overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Reference / doc
                </th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((p) => (
                <tr
                  key={`${p.source}-${p.id}`}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={sourceBadgeClass(p)}>
                      {sourceLabel(p)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={METHOD_STYLES[p.paymentMethod] ?? ""}>
                      {p.paymentMethod.replace("_", " ")}
                    </Badge>
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-semibold tabular-nums ${
                      p.source === "OUTBOUND_REFUND" ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {p.source === "OUTBOUND_REFUND" ? "−" : ""}
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="hidden max-w-[220px] truncate px-4 py-3 text-muted-foreground lg:table-cell">
                    {p.source === "RECEIPT_ALLOCATION" && p.receiptNumber ? (
                      <Link
                        href={`/receipts/${p.receiptId}`}
                        className="text-primary hover:underline"
                      >
                        {p.receiptNumber}
                      </Link>
                    ) : p.source === "OUTBOUND_REFUND" ? (
                      <span className="tabular-nums">{p.outboundPaymentNumber}</span>
                    ) : (
                      (p.referenceNumber ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {p.source === "RECEIPT_ALLOCATION" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() =>
                            void openSignedPdfFromApiPath(`/receipts/${p.receiptId}/pdf`, {
                              unavailable: "Receipt PDF not available.",
                              failed: "Failed to open receipt PDF",
                            })
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Receipt PDF
                        </Button>
                      )}
                      {p.source === "OUTBOUND_REFUND" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() =>
                            void openSignedPdfFromApiPath(`/payments/outbound/${p.id}/pdf`, {
                              unavailable: "Voucher PDF not available.",
                              failed: "Failed to open voucher PDF",
                            })
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Voucher PDF
                        </Button>
                      )}
                      {p.source === "LEGACY_PAYMENT" && (
                        <span className="self-center text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
