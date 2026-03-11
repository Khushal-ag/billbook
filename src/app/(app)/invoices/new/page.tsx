import dynamic from "next/dynamic";
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

function normalizeInvoiceType(value: string | undefined): InvoiceType {
  switch (value) {
    case "SALE_INVOICE":
    case "SALE_RETURN":
    case "PURCHASE_INVOICE":
    case "PURCHASE_RETURN":
      return value;
    default:
      return "SALE_INVOICE";
  }
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const invoiceType = normalizeInvoiceType(params.type);

  return <InvoiceCreatePage initialType={invoiceType} />;
}
