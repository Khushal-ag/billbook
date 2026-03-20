import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TablePagination from "@/components/TablePagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openSignedPdfFromApiPath } from "@/lib/signed-pdf";
import { OUTBOUND_CATEGORY_LABELS } from "@/constants/outbound-payment";
import { PAYMENT_METHOD_LABEL } from "@/constants/receipt-ui";
import type { OutboundPayment } from "@/types/outbound-payment";

interface OutboundPaymentsTableProps {
  payments: OutboundPayment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function OutboundPaymentsTable({
  payments,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: OutboundPaymentsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
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
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">PDF</th>
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
                    {p.category === "EXPENSE" ? (
                      <span>{p.payeeName ?? "—"}</span>
                    ) : (
                      <span className="truncate">
                        {p.partyName ?? `Party #${p.partyId ?? "—"}`}
                      </span>
                    )}
                    {p.invoiceId != null && p.category === "SALE_RETURN_REFUND" && (
                      <div className="mt-0.5 text-xs">
                        <Link
                          href={`/invoices/${p.invoiceId}`}
                          className="text-primary hover:underline"
                        >
                          Return invoice
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {PAYMENT_METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                    </span>
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
        {totalPages > 1 && (
          <div className="border-t p-4">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
