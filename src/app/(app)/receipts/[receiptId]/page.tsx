"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Landmark, List, User, Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorBanner from "@/components/ErrorBanner";
import SettingsSkeleton from "@/components/skeletons/SettingsSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReceiptAllocationEditor } from "@/components/receipts/ReceiptSections";
import { PAYMENT_METHOD_LABEL } from "@/constants/receipt-ui";
import { useReceipt } from "@/hooks/use-receipts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { openSignedPdfFromApiPath } from "@/lib/signed-pdf";

export default function ReceiptDetailPage() {
  const params = useParams<{ receiptId?: string | string[] }>();
  const idParam = Array.isArray(params?.receiptId) ? params.receiptId[0] : params?.receiptId;
  const receiptId = idParam ? parseInt(idParam, 10) : NaN;

  const {
    data: receipt,
    isPending,
    error,
    refetch,
  } = useReceipt(Number.isFinite(receiptId) ? receiptId : undefined);

  useEffect(() => {
    if (typeof window === "undefined" || !Number.isFinite(receiptId)) return;
    if (isPending || !receipt) return;
    if (window.location.hash !== "#allocate") return;
    const t = window.setTimeout(() => {
      document.getElementById("allocate")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [isPending, receipt, receiptId]);

  if (!Number.isFinite(receiptId)) {
    return (
      <div className="page-container">
        <ErrorBanner error={{ message: "Invalid receipt" }} fallbackMessage="Invalid receipt ID." />
      </div>
    );
  }

  if (isPending) return <SettingsSkeleton />;

  if (!receipt) {
    return (
      <div className="page-container max-w-2xl">
        <PageHeader title="Receipt" description="" />
        <ErrorBanner error={error} fallbackMessage="Receipt not found." />
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/receipts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to receipts
          </Link>
        </Button>
      </div>
    );
  }

  const totalReceipt = parseFloat(receipt.totalAmount ?? "0") || 0;
  const allocatedSum = (receipt.allocations ?? []).reduce(
    (s, a) => s + (parseFloat(a.amount) || 0),
    0,
  );
  const remaining = Math.max(0, totalReceipt - allocatedSum);
  const allocPct =
    totalReceipt > 0 ? Math.min(100, Math.round((allocatedSum / totalReceipt) * 100)) : 0;
  const methodLabel =
    PAYMENT_METHOD_LABEL[receipt.paymentMethod] ?? receipt.paymentMethod.replace(/_/g, " ");

  const appliedAllocations = (receipt.allocations ?? []).filter(
    (a) => (parseFloat(a.amount) || 0) > 0.001,
  );

  return (
    <div className="page-container max-w-5xl animate-fade-in space-y-8 pb-10">
      <Link
        href="/receipts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        All receipts
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="grid lg:grid-cols-[1fr_minmax(280px,340px)] lg:items-stretch">
          {/* Left: identity & meta */}
          <div className="flex flex-col gap-6 border-b border-border/60 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                Money in
              </Badge>
              {remaining > 0.001 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/5 font-normal text-amber-800 dark:text-amber-200"
                >
                  {formatCurrency(String(remaining))} unallocated
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {receipt.receiptNumber}
              </h1>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <span>
                    Received{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(receipt.receivedAt || receipt.createdAt)}
                    </span>
                  </span>
                </div>
                {receipt.partyName != null && receipt.partyName !== "" && (
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      Party:{" "}
                      <Link
                        href={`/parties/${receipt.partyId}/ledger`}
                        className="font-medium text-primary hover:underline"
                      >
                        {receipt.partyName}
                      </Link>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Landmark className="h-4 w-4" />
                  </span>
                  <span>
                    <Badge variant="outline" className="mr-2 align-middle font-normal">
                      {methodLabel}
                    </Badge>
                    {receipt.referenceNumber && (
                      <span className="text-muted-foreground">
                        Ref. <span className="tabular-nums">{receipt.referenceNumber}</span>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {receipt.notes?.trim() && (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm">
                <span className="font-medium text-foreground">Notes</span>
                <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">{receipt.notes}</p>
              </div>
            )}
          </div>

          {/* Right: amount & actions */}
          <div className="flex flex-col justify-between gap-8 bg-muted/25 p-6 sm:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount received
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                {formatCurrency(receipt.totalAmount)}
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4 shrink-0 opacity-70" />
                    Allocated to invoices
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(String(allocatedSum))}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={allocPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Share of receipt allocated"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${allocPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Still unallocated</span>
                  <span
                    className={cn(
                      "shrink-0 font-medium tabular-nums",
                      remaining > 0.001
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatCurrency(String(remaining))}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-border/60 lg:hidden" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  void openSignedPdfFromApiPath(`/receipts/${receiptId}/pdf`, {
                    unavailable: "Receipt PDF not available (configure storage).",
                    failed: "Failed to open receipt PDF",
                  })
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/receipts">
                  <List className="mr-2 h-4 w-4" />
                  All receipts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ErrorBanner error={error} />

      {appliedAllocations.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/15 px-6 py-4 sm:px-8">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Applied to invoices
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Where this receipt amount has been allocated.
            </p>
          </CardHeader>
          <CardContent className="px-6 py-4 sm:px-8 sm:py-6">
            <div className="overflow-x-auto rounded-lg border border-border/80">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appliedAllocations.map((a) => (
                    <tr
                      key={`${a.invoiceId}-${a.amount}`}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/invoices/${a.invoiceId}`}
                          className="text-primary hover:underline"
                        >
                          {a.invoiceNumber ?? `Invoice #${a.invoiceId}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {formatCurrency(a.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {remaining > 0.001 && (
        <ReceiptAllocationEditor
          receiptId={receiptId}
          receipt={receipt}
          onSaved={() => void refetch()}
        />
      )}
    </div>
  );
}
