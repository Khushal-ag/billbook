import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { BusinessIdentity } from "../BusinessIdentity";
import { getInvoiceBalanceDue, INVOICE_TYPE_OPTIONS } from "@/lib/invoice";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceDetail } from "@/types/invoice";

interface InvoiceSummaryCardsProps {
  invoice: InvoiceDetail;
  balanceDue: string;
  businessLogoUrl?: string | null;
  businessName?: string | null;
}

export function InvoiceSummaryCards({
  invoice,
  balanceDue,
  businessLogoUrl,
  businessName,
}: InvoiceSummaryCardsProps) {
  const balanceDueValue = getInvoiceBalanceDue(invoice);
  const typeLabel =
    INVOICE_TYPE_OPTIONS.find((o) => o.type === invoice.invoiceType)?.label ?? invoice.invoiceType;
  const isFullyPaid = balanceDueValue <= 0 && invoice.status === "FINAL";

  const partyHeading = invoice.partyType === "SUPPLIER" ? "Supplier" : "Bill to";

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        {/* Status accent bar */}
        <div
          className={cn(
            "h-1.5",
            invoice.status === "DRAFT" && "bg-amber-400",
            invoice.status === "FINAL" && (isFullyPaid ? "bg-emerald-500" : "bg-primary"),
            invoice.status === "CANCELLED" && "bg-muted-foreground/30",
          )}
        />

        <div className="space-y-5 p-6">
          {/* Header: Logo + Invoice Number aligned horizontally | Status badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <BusinessIdentity
                name={businessName}
                logoUrl={businessLogoUrl}
                size="md"
                showName={!businessLogoUrl}
                nameClassName="text-sm font-semibold text-foreground"
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {typeLabel}
                </p>
                <h2 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h2>
              </div>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="border-t" />

          {/* Party (left) + Dates (right) — single source for identity & dates */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {partyHeading}
              </p>
              <p className="font-semibold">{invoice.partyName ?? "—"}</p>
              {invoice.partyPhone ? (
                <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">
                  {invoice.partyPhone}
                </p>
              ) : null}
              {invoice.partyGstin ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  GSTIN {invoice.partyGstin}
                </p>
              ) : null}
            </div>
            <div className="space-y-1 text-sm sm:text-right">
              <div>
                <span className="text-muted-foreground">Invoice date </span>
                <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Due date </span>
                <span
                  className={cn(
                    "font-medium",
                    invoice.dueDate ? "" : "text-muted-foreground",
                    invoice.dueDate && invoice.isOverdue && "text-destructive",
                  )}
                >
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                </span>
                {invoice.dueDate &&
                  invoice.isOverdue &&
                  invoice.overdueDays &&
                  invoice.overdueDays > 0 && (
                    <span className="ml-1 text-xs text-destructive">
                      ({invoice.overdueDays}d overdue)
                    </span>
                  )}
              </div>
              {invoice.financialYear && (
                <div>
                  <span className="text-muted-foreground">FY </span>
                  <span className="font-medium">{invoice.financialYear}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* Amounts — invoice total + settlement; breakdown lives in bill summary below */}
          <div className="flex flex-wrap justify-end gap-8">
            <div>
              <p className="text-xs text-muted-foreground">Invoice total</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-base font-semibold tabular-nums text-emerald-600">
                {formatCurrency(invoice.paidAmount ?? "0")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance due</p>
              <p
                className={cn(
                  "text-base font-semibold tabular-nums",
                  isFullyPaid ? "text-emerald-600" : invoice.isOverdue ? "text-destructive" : "",
                )}
              >
                {isFullyPaid ? "Paid in full" : formatCurrency(balanceDue)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
