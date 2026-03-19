"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useInvoice } from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import ErrorBanner from "@/components/ErrorBanner";

const InvoiceCreatePage = dynamic(
  () =>
    import("@/components/invoices/InvoiceCreatePage").then((mod) => ({
      default: mod.InvoiceCreatePage,
    })),
  {
    loading: () => (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  },
);

export default function EditDraftInvoicePage() {
  const params = useParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const idStr = raw != null ? String(raw).trim() : "";
  const invoiceId = idStr && /^\d+$/.test(idStr) ? Number(idStr) : undefined;

  const { data: inv, isPending, error } = useInvoice(invoiceId);

  if (!invoiceId) {
    return (
      <div className="page-container space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/invoices" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Invoices
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Invalid invoice link.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="page-container flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !inv) {
    return (
      <div className="page-container space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/invoices/${invoiceId}`} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <ErrorBanner error={error} fallbackMessage="Could not load invoice" />
      </div>
    );
  }

  if (inv.status !== "DRAFT") {
    return (
      <div className="page-container max-w-lg animate-fade-in space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/invoices/${invoiceId}`} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to invoice
          </Link>
        </Button>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-foreground">This invoice can&apos;t be edited here.</p>
          <p className="mt-1 text-muted-foreground">
            Only <strong>draft</strong> invoices can be changed. This one is{" "}
            <strong>{inv.status}</strong>. Finalized or cancelled invoices must be adjusted with
            credit notes or other workflows.
          </p>
        </div>
      </div>
    );
  }

  return <InvoiceCreatePage initialType={inv.invoiceType} editInvoiceId={invoiceId} />;
}
