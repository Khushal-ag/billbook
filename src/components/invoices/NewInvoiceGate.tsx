"use client";

import dynamic from "next/dynamic";
import { ReturnSourceInvoicePicker } from "@/components/invoices/ReturnSourceInvoicePicker";
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
  const needsReturnSourcePicker =
    (initialType === "SALE_RETURN" || initialType === "PURCHASE_RETURN") &&
    initialSourceInvoiceId == null;

  if (needsReturnSourcePicker) {
    return <ReturnSourceInvoicePicker returnType={initialType} />;
  }

  return (
    <InvoiceCreatePage initialType={initialType} initialSourceInvoiceId={initialSourceInvoiceId} />
  );
}
