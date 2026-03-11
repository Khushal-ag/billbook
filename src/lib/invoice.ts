import type { Invoice, InvoiceType } from "@/types/invoice";

function parseAmount(value: string | null | undefined): number {
  const parsed = parseFloat((value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Use API dueAmount when valid; if backend returns 0 for unpaid invoices,
 * fall back to total - paid to keep UI balance accurate.
 */
export function getInvoiceBalanceDue(
  invoice: Pick<Invoice, "totalAmount" | "paidAmount" | "dueAmount">,
): number {
  const total = parseAmount(invoice.totalAmount);
  const paid = parseAmount(invoice.paidAmount);
  const computed = Math.max(0, total - paid);
  const due = parseAmount(invoice.dueAmount);

  // Prefer computed value when it indicates outstanding balance but API due is zero.
  if (computed > 0 && due <= 0) return computed;
  return Math.max(0, due || computed);
}

export const INVOICE_TYPE_OPTIONS: Array<{
  type: InvoiceType;
  path: string;
  label: string;
  shortLabel: string;
}> = [
  {
    type: "SALE_INVOICE",
    path: "/invoices/sales",
    label: "Sales Invoice",
    shortLabel: "Sales",
  },
  {
    type: "PURCHASE_INVOICE",
    path: "/invoices/purchases",
    label: "Purchase Invoice",
    shortLabel: "Purchase",
  },
  {
    type: "SALE_RETURN",
    path: "/invoices/sales-return",
    label: "Sales Return",
    shortLabel: "Sales Return",
  },
  {
    type: "PURCHASE_RETURN",
    path: "/invoices/purchase-return",
    label: "Purchase Return",
    shortLabel: "Purchase Return",
  },
];

export function isSalesFamily(type: InvoiceType): boolean {
  return type === "SALE_INVOICE" || type === "SALE_RETURN";
}

/** UI copy for the invoice create flow — aligns labels and descriptions with each invoice type. */
export interface InvoiceTypeCreateCopy {
  /** Page description (create screen). */
  pageDescription: string;
  /** First card: party + discount (e.g. "Vendor & bill details"). */
  partyCardTitle: string;
  /** Second card: dates + notes (e.g. "Bill details"). */
  detailsCardTitle: string;
  /** Label for party field (e.g. "Vendor", "Customer"). */
  partyLabel: string;
  /** Placeholder for party search (e.g. "vendor", "customer"). */
  partyPlaceholder: string;
  /** "Add vendor" / "Add customer". */
  addPartyLabel: string;
  /** Discount amount label (e.g. "Discount from vendor"). */
  discountAmountLabel: string;
  /** Discount % label. */
  discountPercentLabel: string;
  /** Item section card title (e.g. "Items received", "Items you're selling"). */
  itemSectionTitle: string;
  /** Batch/item column label (e.g. "Item / Batch"). */
  batchLabel: string;
  /** Placeholder when no batch selected (e.g. "Search items or stock batches"). */
  batchPlaceholder: string;
  /** Optional helper under item section (e.g. purchase: items can be added before stock exists). */
  itemSectionHelper: string | null;
  /** Summary card title (e.g. "Bill summary", "Purchase summary"). */
  summaryTitle: string;
  /** Error banner when items/stock fail to load. */
  loadErrorMessage: string;
}

const INVOICE_TYPE_CREATE_COPY: Record<InvoiceType, InvoiceTypeCreateCopy> = {
  SALE_INVOICE: {
    pageDescription: "Create invoices for what you're selling to customers. Pick items from stock.",
    partyCardTitle: "Customer & invoice details",
    detailsCardTitle: "Invoice details",
    partyLabel: "Customer",
    partyPlaceholder: "customer",
    addPartyLabel: "Add customer",
    discountAmountLabel: "Bill discount amount",
    discountPercentLabel: "Bill discount %",
    itemSectionTitle: "Items",
    batchLabel: "Item / Batch",
    batchPlaceholder: "Search stock batches",
    itemSectionHelper: null,
    summaryTitle: "Bill summary",
    loadErrorMessage: "Failed to load stock entries. Check connection and try again.",
  },
  PURCHASE_INVOICE: {
    pageDescription:
      "Record what you received from the vendor. Add any item from the bill — you can add stock for it later if needed.",
    partyCardTitle: "Vendor & bill details",
    detailsCardTitle: "Bill details",
    partyLabel: "Vendor",
    partyPlaceholder: "vendor",
    addPartyLabel: "Add vendor",
    discountAmountLabel: "Discount from vendor",
    discountPercentLabel: "Discount %",
    itemSectionTitle: "Items received",
    batchLabel: "Item / Batch",
    batchPlaceholder: "Search items or add new — stock can be added later",
    itemSectionHelper:
      "Add everything from your vendor bill. Items don't need to be in stock yet; you can add stock afterwards.",
    summaryTitle: "Purchase summary",
    loadErrorMessage: "Failed to load items. Check connection and try again.",
  },
  SALE_RETURN: {
    pageDescription: "Record items returned by the customer. Select from existing stock.",
    partyCardTitle: "Customer & return details",
    detailsCardTitle: "Return details",
    partyLabel: "Customer",
    partyPlaceholder: "customer",
    addPartyLabel: "Add customer",
    discountAmountLabel: "Adjustment amount",
    discountPercentLabel: "Adjustment %",
    itemSectionTitle: "Items returned",
    batchLabel: "Item / Batch",
    batchPlaceholder: "Search stock batches",
    itemSectionHelper: null,
    summaryTitle: "Return summary",
    loadErrorMessage: "Failed to load stock entries. Check connection and try again.",
  },
  PURCHASE_RETURN: {
    pageDescription: "Record items you're returning to the vendor. Select from stock.",
    partyCardTitle: "Vendor & return details",
    detailsCardTitle: "Return details",
    partyLabel: "Vendor",
    partyPlaceholder: "vendor",
    addPartyLabel: "Add vendor",
    discountAmountLabel: "Adjustment amount",
    discountPercentLabel: "Adjustment %",
    itemSectionTitle: "Items returned",
    batchLabel: "Item / Batch",
    batchPlaceholder: "Search stock batches",
    itemSectionHelper: null,
    summaryTitle: "Return summary",
    loadErrorMessage: "Failed to load stock entries. Check connection and try again.",
  },
};

export function getInvoiceTypeCreateCopy(type: InvoiceType): InvoiceTypeCreateCopy {
  return INVOICE_TYPE_CREATE_COPY[type];
}
