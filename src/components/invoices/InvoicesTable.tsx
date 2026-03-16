"use client";

import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { getInvoiceBalanceDue } from "@/lib/invoice";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceType } from "@/types/invoice";

interface InvoicesTableProps {
  invoices: Invoice[];
  invoiceType: InvoiceType;
}

export function InvoicesTable({ invoices, invoiceType }: InvoicesTableProps) {
  const router = useRouter();
  const returnTypeByInvoiceType: Record<InvoiceType, InvoiceType | null> = {
    SALE_INVOICE: "SALE_RETURN",
    PURCHASE_INVOICE: "PURCHASE_RETURN",
    SALE_RETURN: null,
    PURCHASE_RETURN: null,
  };
  const returnInvoiceType = returnTypeByInvoiceType[invoiceType];
  const showReturnAction = returnInvoiceType !== null;
  const returnButtonLabel =
    returnInvoiceType === "SALE_RETURN" ? "Sales Return" : "Purchase Return";

  return (
    <div className="data-table-container -mx-1 px-1 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[300px] text-sm" role="table" aria-label="Invoices list">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
            >
              Invoice #
            </th>
            <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
              Party
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground sm:table-cell"
            >
              Date
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
            >
              Due Date
            </th>
            <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
              Amount
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell"
            >
              Balance Due
            </th>
            <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
              Status
            </th>
            {showReturnAction && (
              <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
                Return
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const balanceDue = getInvoiceBalanceDue(inv);
            const isFullyPaid = balanceDue <= 0 && inv.status === "FINAL";

            return (
              <tr
                key={inv.id}
                onClick={() => router.push(`/invoices/${inv.id}`)}
                className={cn(
                  "group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20",
                  inv.isOverdue && "border-l-2 border-l-amber-400",
                )}
              >
                {/* Mobile: single-cell card-like row */}
                <td className="block px-4 py-3 sm:hidden" colSpan={showReturnAction ? 8 : 7}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-accent">{inv.invoiceNumber}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="mt-0.5 truncate text-sm text-muted-foreground">
                        {inv.partyName ?? "—"}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(inv.invoiceDate)}</span>
                        {inv.isOverdue && inv.overdueDays && inv.overdueDays > 0 && (
                          <span className="text-destructive">Overdue {inv.overdueDays}d</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold tabular-nums">
                        {formatCurrency(inv.totalAmount ?? "0")}
                      </div>
                      {!isFullyPaid && balanceDue > 0 && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Due {formatCurrency(balanceDue)}
                        </div>
                      )}
                      {isFullyPaid && <div className="mt-0.5 text-xs text-emerald-600">Paid</div>}
                      {showReturnAction && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 px-2 text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(
                              `/invoices/new?type=${returnInvoiceType}&sourceInvoiceId=${inv.id}`,
                            );
                          }}
                        >
                          {returnButtonLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </td>

                {/* Desktop: normal table cells */}
                <td className="hidden px-4 py-3 sm:table-cell sm:px-6">
                  <span className="font-medium text-accent group-hover:underline">
                    {inv.invoiceNumber}
                  </span>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">{inv.partyName ?? "—"}</td>
                <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                  {formatDate(inv.invoiceDate)}
                </td>
                <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                  <div className="flex flex-col">
                    <span>{formatDate(inv.dueDate)}</span>
                    {inv.isOverdue && inv.overdueDays !== undefined && inv.overdueDays > 0 && (
                      <span className="text-xs text-destructive">Overdue {inv.overdueDays}d</span>
                    )}
                  </div>
                </td>
                <td className="hidden px-3 py-3 text-right font-medium tabular-nums sm:table-cell">
                  {formatCurrency(inv.totalAmount ?? "0")}
                </td>
                <td
                  className={cn(
                    "hidden px-3 py-3 text-right font-medium tabular-nums md:table-cell",
                    isFullyPaid && "text-emerald-600",
                    inv.isOverdue && "text-destructive",
                  )}
                >
                  {isFullyPaid ? "Paid" : formatCurrency(balanceDue)}
                </td>
                <td className="hidden px-3 py-3 text-center sm:table-cell">
                  <StatusBadge status={inv.status} />
                </td>
                {showReturnAction && (
                  <td className="hidden px-3 py-3 text-center sm:table-cell">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(
                          `/invoices/new?type=${returnInvoiceType}&sourceInvoiceId=${inv.id}`,
                        );
                      }}
                    >
                      {returnButtonLabel}
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
