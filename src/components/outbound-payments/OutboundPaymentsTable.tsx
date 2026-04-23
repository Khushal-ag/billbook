import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TablePagination from "@/components/TablePagination";
import { formatCurrency, formatDate } from "@/lib/core/utils";
import { openSignedPdfFromApiPath } from "@/lib/ui/signed-pdf";
import { OUTBOUND_CATEGORY_LABELS } from "@/constants/outbound-payment";
import { PAYMENT_METHOD_LABEL } from "@/constants/receipt-ui";
import type { OutboundPayment } from "@/types/outbound-payment";

/** Prefer directory lookup by id when the API omits or mis-sends `partyName`. */
function outboundPartyDisplayName(
  p: OutboundPayment,
  partyNamesById?: ReadonlyMap<number, string>,
): string {
  if (p.category === "EXPENSE") {
    return p.payeeName?.trim() || "—";
  }
  const id = p.partyId;
  if (id != null) {
    const fromDirectory = partyNamesById?.get(id);
    if (fromDirectory?.trim()) return fromDirectory.trim();
  }
  const raw = p.partyName?.trim();
  if (raw) return raw;
  return id != null ? "Unknown party" : "—";
}

interface OutboundPaymentsTableProps {
  payments: OutboundPayment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Inclusive row range on this page (for the summary bar). */
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (p: number) => void;
  /** Resolve `partyId` → display name when the list API does not return `partyName`. */
  partyNamesById?: ReadonlyMap<number, string>;
}

export function OutboundPaymentsTable({
  payments,
  page,
  pageSize,
  total,
  totalPages,
  rangeStart,
  rangeEnd,
  onPageChange,
  partyNamesById,
}: OutboundPaymentsTableProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          of <span className="font-medium tabular-nums text-foreground">{total}</span> payout
          {total === 1 ? "" : "s"}
        </div>
        <div className="data-table-container overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Voucher</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Party / payee
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Voucher PDF
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium tabular-nums">{p.paymentNumber}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="whitespace-nowrap">
                      {OUTBOUND_CATEGORY_LABELS[p.category] ?? p.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="max-w-[200px] px-4 py-3">
                    <span className="truncate">{outboundPartyDisplayName(p, partyNamesById)}</span>
                    {p.invoiceId != null && p.category === "SALE_RETURN_REFUND" && (
                      <div className="mt-0.5 text-xs">
                        <Link
                          href={`/invoices/${p.invoiceId}`}
                          className="text-primary hover:underline"
                        >
                          Sales return
                        </Link>
                      </div>
                    )}
                    {p.invoiceId != null && p.category === "PARTY_PAYMENT" && (
                      <div className="mt-0.5 text-xs">
                        <Link
                          href={`/invoices/${p.invoiceId}`}
                          className="text-primary hover:underline"
                        >
                          Purchase bill
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-normal">
                      {PAYMENT_METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-700">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() =>
                        void openSignedPdfFromApiPath(`/payments/outbound/${p.id}/pdf`, {
                          unavailable: "Voucher PDF not available (configure storage).",
                          failed: "Failed to open voucher PDF",
                        })
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="border-t border-border bg-muted/20 px-4 py-3">
            <TablePagination
              className="mt-0"
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
