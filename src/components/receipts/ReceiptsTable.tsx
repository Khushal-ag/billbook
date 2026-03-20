import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TablePagination from "@/components/TablePagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABEL } from "@/constants/receipt-ui";
import type { ReceiptListItem } from "@/types/receipt";

interface ReceiptsTableProps {
  receipts: ReceiptListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function ReceiptsTable({
  receipts,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: ReceiptsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="data-table-container overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Party</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Unallocated
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => {
                const canAllocate = parseFloat(r.unallocatedAmount || "0") > 0.001;
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {canAllocate ? (
                        <span className="font-medium tabular-nums text-foreground">
                          {r.receiptNumber}
                        </span>
                      ) : (
                        <Link
                          href={`/receipts/${r.id}`}
                          className="font-medium tabular-nums text-primary hover:underline"
                        >
                          {r.receiptNumber}
                        </Link>
                      )}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">
                      {r.partyName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(r.receivedAt || r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {PAYMENT_METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {parseFloat(r.unallocatedAmount || "0") > 0 ? (
                        <span className="font-medium text-amber-700">
                          {formatCurrency(r.unallocatedAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canAllocate ? (
                        <Button variant="default" size="sm" className="h-8" asChild>
                          <Link href={`/receipts/${r.id}#allocate`}>Allocate</Link>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-muted-foreground"
                          disabled
                          title="Nothing left to allocate"
                        >
                          Allocate
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
