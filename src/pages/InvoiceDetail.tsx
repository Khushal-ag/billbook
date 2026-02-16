import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Pencil, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InvoiceDetailSkeleton from "@/components/skeletons/InvoiceDetailSkeleton";
import StatusBadge from "@/components/StatusBadge";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import InvoiceEditDialog from "@/components/dialogs/InvoiceEditDialog";
import PaymentDialog from "@/components/dialogs/PaymentDialog";
import {
  useInvoice,
  useFinalizeInvoice,
  useCancelInvoice,
  useInvoicePdf,
} from "@/hooks/use-invoices";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceId = id ? Number(id) : undefined;
  const { isOwner } = usePermissions();

  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const { data: pdfData } = useInvoicePdf(invoice?.status === "FINAL" ? invoiceId : undefined);
  const finalizeMutation = useFinalizeInvoice();
  const cancelMutation = useCancelInvoice();

  const handleFinalize = async () => {
    if (!invoiceId) return;
    try {
      await finalizeMutation.mutateAsync(invoiceId);
      showSuccessToast("Invoice finalized");
    } catch (err) {
      showErrorToast(err, "Failed to finalize");
    }
  };

  const handleCancel = async () => {
    if (!invoiceId) return;
    if (!confirm("Cancel this invoice? This cannot be undone.")) return;
    try {
      await cancelMutation.mutateAsync(invoiceId);
      showSuccessToast("Invoice cancelled");
      navigate("/invoices");
    } catch (err) {
      showErrorToast(err, "Failed to cancel");
    }
  };

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-4">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Invoices
        </Link>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load invoice" />

      {!invoice ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Invoice not found.</p>
      ) : (
        <>
          <PageHeader
            title={`Invoice ${invoice.invoiceNumber}`}
            description={`Created ${new Date(invoice.createdAt).toLocaleDateString()}`}
            action={
              <div className="flex gap-2">
                {invoice.status === "DRAFT" && isOwner && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel Invoice
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleFinalize}
                      disabled={finalizeMutation.isPending}
                    >
                      {finalizeMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Finalize
                    </Button>
                  </>
                )}
                {invoice.status === "FINAL" && (
                  <Button variant="outline" size="sm" onClick={() => setPaymentOpen(true)}>
                    <CreditCard className="mr-2 h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                )}
                {pdfData?.downloadUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={pdfData.downloadUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-3.5 w-3.5" />
                      PDF
                    </a>
                  </Button>
                )}
              </div>
            }
          />

          {/* Invoice Summary */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={invoice.status} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(invoice.totalAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(invoice.paidAmount ?? "0")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Balance Due</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(
                    parseFloat((invoice.totalAmount ?? "0").replace(/,/g, "")) -
                      parseFloat((invoice.paidAmount ?? "0").replace(/,/g, "")),
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Date</span>
                  <span>{invoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{invoice.dueDate ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Financial Year</span>
                  <span>{invoice.financialYear ?? "—"}</span>
                </div>
                {invoice.notes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="max-w-[200px] text-right">{invoice.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tax Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span>{formatCurrency(invoice.subTotal)}</span>
                </div>
                {invoice.discountAmount && invoice.discountAmount !== "0" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                {invoice.cgstAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST</span>
                    <span>{formatCurrency(invoice.cgstAmount)}</span>
                  </div>
                )}
                {invoice.sgstAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST</span>
                    <span>{formatCurrency(invoice.sgstAmount)}</span>
                  </div>
                )}
                {invoice.igstAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST</span>
                    <span>{formatCurrency(invoice.igstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.items.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No items.</p>
              ) : (
                <div className="data-table-container">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Unit Price
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Discount
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Tax
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => {
                        const tax =
                          parseFloat(item.cgstAmount ?? "0") +
                          parseFloat(item.sgstAmount ?? "0") +
                          parseFloat(item.igstAmount ?? "0");
                        return (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2 font-medium">
                              {item.productName ?? `Product #${item.productId}`}
                            </td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {item.discountPercent && item.discountPercent !== "0"
                                ? `${item.discountPercent}%`
                                : "—"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {tax > 0 ? formatCurrency(tax) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(item.lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="data-table-container">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Method
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.payments.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">{p.paymentMethod}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {p.referenceNumber ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dialogs */}
          {invoice.status === "DRAFT" && (
            <InvoiceEditDialog open={editOpen} onOpenChange={setEditOpen} invoice={invoice} />
          )}
          {invoice.status === "FINAL" && invoiceId && (
            <PaymentDialog
              open={paymentOpen}
              onOpenChange={setPaymentOpen}
              invoiceId={invoiceId}
              balanceDue={String(
                parseFloat((invoice.totalAmount ?? "0").replace(/,/g, "")) -
                  parseFloat((invoice.paidAmount ?? "0").replace(/,/g, "")),
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
