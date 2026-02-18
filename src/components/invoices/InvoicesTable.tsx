import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm" role="table" aria-label="Invoices list">
        <thead>
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
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3 sm:px-6">
                <Link
                  to={`/invoices/${inv.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td className="px-3 py-3">{inv.partyName ?? "—"}</td>
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
              <td className="px-3 py-3 text-right font-medium">
                {formatCurrency(inv.totalAmount ?? "0")}
              </td>
              <td className="hidden px-3 py-3 text-right font-medium md:table-cell">
                {formatCurrency(
                  inv.dueAmount ??
                    parseFloat((inv.totalAmount ?? "0").replace(/,/g, "")) -
                      parseFloat((inv.paidAmount ?? "0").replace(/,/g, "")),
                )}
              </td>
              <td className="px-3 py-3 text-center">
                <StatusBadge status={inv.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
