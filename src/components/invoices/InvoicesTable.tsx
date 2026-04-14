"use client";

import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { getInvoiceBalanceDue } from "@/lib/invoice";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceType } from "@/types/invoice";

interface InvoicesTableProps {
  invoices: Invoice[];
  invoiceType: InvoiceType;
}

export function InvoicesTable({ invoices, invoiceType }: InvoicesTableProps) {
  const router = useRouter();
  const showVendorBillColumn =
    invoiceType === "PURCHASE_INVOICE" || invoiceType === "PURCHASE_RETURN";
  const mobileColSpan = showVendorBillColumn ? 8 : 7;

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
            {showVendorBillColumn && (
              <th
                scope="col"
                className="hidden px-3 py-3 text-left font-medium text-muted-foreground lg:table-cell"
              >
                Vendor bill
              </th>
            )}
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
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isCancelled = inv.status === "CANCELLED";
            const balanceDue = isCancelled ? 0 : getInvoiceBalanceDue(inv);
            const isFullyPaid = !isCancelled && balanceDue <= 0 && inv.status === "FINAL";
            const showOverdueChrome = Boolean(inv.isOverdue && !isCancelled);

            return (
              <tr
                key={inv.id}
                onClick={() => router.push(`/invoices/${inv.id}`)}
                className={cn(
                  "group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20",
                  showOverdueChrome && "border-l-2 border-l-amber-400",
                  isCancelled && "opacity-90",
                )}
              >
                <td className="block px-4 py-3 sm:hidden" colSpan={mobileColSpan}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-accent">{inv.invoiceNumber}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="mt-0.5 truncate text-sm text-muted-foreground">
                        {inv.partyName ?? "—"}
                      </div>
                      {showVendorBillColumn && inv.originalBillNumber?.trim() ? (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          Vendor bill {inv.originalBillNumber.trim()}
                        </div>
                      ) : null}
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(inv.invoiceDate)}</span>
                        {showOverdueChrome && inv.overdueDays && inv.overdueDays > 0 && (
                          <span className="text-destructive">Overdue {inv.overdueDays}d</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold tabular-nums">
                        {formatCurrency(inv.totalAmount ?? "0")}
                      </div>
                      {!isCancelled && !isFullyPaid && balanceDue > 0 && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Due {formatCurrency(balanceDue)}
                        </div>
                      )}
                      {isCancelled && (
                        <div className="mt-0.5 text-xs text-muted-foreground">Cancelled</div>
                      )}
                      {isFullyPaid && <div className="mt-0.5 text-xs text-emerald-600">Paid</div>}
                    </div>
                  </div>
                </td>

                <td className="hidden px-4 py-3 sm:table-cell sm:px-6">
                  <span className="font-medium text-accent group-hover:underline">
                    {inv.invoiceNumber}
                  </span>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">{inv.partyName ?? "—"}</td>
                {showVendorBillColumn && (
                  <td className="hidden max-w-[10rem] truncate px-3 py-3 text-muted-foreground lg:table-cell">
                    {inv.originalBillNumber?.trim() || "—"}
                  </td>
                )}
                <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                  {formatDate(inv.invoiceDate)}
                </td>
                <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                  <div className="flex flex-col">
                    <span>{formatDate(inv.dueDate)}</span>
                    {showOverdueChrome && inv.overdueDays !== undefined && inv.overdueDays > 0 && (
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
                    showOverdueChrome && "text-destructive",
                    isCancelled && "text-muted-foreground",
                  )}
                >
                  {isCancelled ? "—" : isFullyPaid ? "Paid" : formatCurrency(balanceDue)}
                </td>
                <td className="hidden px-3 py-3 text-center sm:table-cell">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
