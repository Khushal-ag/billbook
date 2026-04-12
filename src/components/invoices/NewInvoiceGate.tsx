"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ReturnSourceInvoicePicker } from "@/components/invoices/ReturnSourceInvoicePicker";
import { BusinessProfileGateAlert } from "@/components/business/BusinessProfileGateAlert";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useCanCreateInvoice } from "@/hooks/use-can-create-invoice";
import type { InvoiceType } from "@/types/invoice";

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

interface NewInvoiceGateProps {
  initialType: InvoiceType;
  initialSourceInvoiceId?: number;
}

export function NewInvoiceGate({ initialType, initialSourceInvoiceId }: NewInvoiceGateProps) {
  const { canCreateInvoice, businessProfile, isPending } = useCanCreateInvoice();

  const needsReturnSourcePicker =
    (initialType === "SALE_RETURN" || initialType === "PURCHASE_RETURN") &&
    initialSourceInvoiceId == null;

  if (isPending || canCreateInvoice === undefined) {
    return (
      <div className="page-container flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Checking business profile…</p>
      </div>
    );
  }

  if (!canCreateInvoice) {
    return (
      <div className="page-container animate-fade-in pb-10">
        <PageHeader
          title="Create invoice"
          description="Your business profile must be complete and your access period must still be active."
        />
        <div className="mx-auto max-w-2xl space-y-6">
          <BusinessProfileGateAlert businessProfile={businessProfile} />
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/profile">Open business profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/invoices/sales">Back to invoices</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (needsReturnSourcePicker) {
    return <ReturnSourceInvoicePicker returnType={initialType} />;
  }

  return (
    <InvoiceCreatePage initialType={initialType} initialSourceInvoiceId={initialSourceInvoiceId} />
  );
}
