import type { Invoice, InvoiceDetail, InvoiceType } from "@/types/invoice";

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

/** Summary strip on `/invoices/...` list pages — headings match document economics (AR vs AP vs returns). */
export interface InvoiceListStatsLabels {
  countHeading: string;
  valueHeading: string;
  paidHeading: string;
  balanceHeading: string;
  /** Used after the count, e.g. "3 overdue" vs "3 past due". */
  balanceAttentionWord: string;
}

export function getInvoiceListStatsLabels(type: InvoiceType): InvoiceListStatsLabels {
  switch (type) {
    case "SALE_INVOICE":
      return {
        countHeading: "Sales invoices",
        valueHeading: "Billed to customers",
        paidHeading: "Collected",
        balanceHeading: "Outstanding receivable",
        balanceAttentionWord: "overdue",
      };
    case "PURCHASE_INVOICE":
      return {
        countHeading: "Purchase bills",
        valueHeading: "Vendor bill totals",
        paidHeading: "Paid to vendors",
        balanceHeading: "Still payable",
        balanceAttentionWord: "past due",
      };
    case "SALE_RETURN":
      return {
        countHeading: "Sales returns",
        valueHeading: "Return totals",
        paidHeading: "Refunded to customers",
        balanceHeading: "Owing to customers",
        balanceAttentionWord: "unsettled",
      };
    case "PURCHASE_RETURN":
      return {
        countHeading: "Purchase returns",
        valueHeading: "Return totals",
        paidHeading: "Credited by vendors",
        balanceHeading: "Vendor credit due",
        balanceAttentionWord: "pending",
      };
    default:
      return getInvoiceListStatsLabels("SALE_INVOICE");
  }
}

export function isSalesFamily(type: InvoiceType): boolean {
  return type === "SALE_INVOICE" || type === "SALE_RETURN";
}

/** Purchase invoices only: vendor’s bill no., dates, and payment terms (API). Returns use the same layout as sales returns. */
export function isPurchaseVendorBillMetaType(type: InvoiceType): boolean {
  return type === "PURCHASE_INVOICE";
}

/** Customer payment via receipt allocation (POST …/payments). */
export function invoiceTypeSupportsReceiptPayment(type: InvoiceType): boolean {
  return type === "SALE_INVOICE";
}

/** Supplier payment on a purchase bill (POST …/supplier-payments → outbound voucher). */
export function invoiceTypeSupportsSupplierPayment(type: InvoiceType): boolean {
  return type === "PURCHASE_INVOICE";
}

/** Outbound payouts refund money to the customer against a finalized sales return. */
export function invoiceTypeSupportsSaleReturnRefund(type: InvoiceType): boolean {
  return type === "SALE_RETURN";
}

/**
 * POST mark-reminder (balance email): only when **we are collecting** — customer owes on a sale, or vendor
 * owes on a purchase return. Not when **we pay** (purchase bill, sales return refund).
 */
export function invoiceTypeSupportsBalanceReminderEmail(type: InvoiceType): boolean {
  return type === "SALE_INVOICE" || type === "PURCHASE_RETURN";
}

/**
 * POST mark-sent (WhatsApp log): documents **we issue** to the party (invoice, credit/return to customer,
 * return to vendor). Omit **purchase bills** — that’s the vendor’s bill to us; we’re the payer, not sharing
 * “our invoice” in the same sense.
 */
export function invoiceTypeSupportsDocumentShareLog(type: InvoiceType): boolean {
  return type === "SALE_INVOICE" || type === "SALE_RETURN" || type === "PURCHASE_RETURN";
}

/** UI copy for the invoice create flow — aligns labels and descriptions with each invoice type. */
export interface InvoiceTypeCreateCopy {
  /** Page description (create screen). */
  pageDescription: string;
  /** First card: party + address (no overlap with document/dates card title). */
  partyCardTitle: string;
  /** Second card: document no., dates, and bill-specific fields. */
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
    partyCardTitle: "Customer & delivery",
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
    partyCardTitle: "Vendor & delivery",
    detailsCardTitle: "Invoice details",
    partyLabel: "Vendor",
    partyPlaceholder: "vendor",
    addPartyLabel: "Add vendor",
    discountAmountLabel: "Discount from vendor",
    discountPercentLabel: "Discount %",
    itemSectionTitle: "Items received",
    batchLabel: "Item / Batch",
    batchPlaceholder: "Search catalog items",
    itemSectionHelper:
      "Catalog items carry HSN/SAC and GST from the master. Enter qty and purchase rate; selling price uses the margin above if you leave it blank on a line.",
    summaryTitle: "Bill summary",
    loadErrorMessage: "Failed to load items. Check connection and try again.",
  },
  SALE_RETURN: {
    pageDescription: "Record items returned by the customer. Select from existing stock.",
    partyCardTitle: "Customer & delivery",
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
    pageDescription: "Record items returned to the vendor. Select from existing stock.",
    partyCardTitle: "Vendor & delivery",
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

/** Bill-style figures for invoice detail (aligned with create flow bill summary). */
export interface InvoiceBillSummary {
  grossAmount: number;
  lineDiscountTotal: number;
  taxableTotal: number;
  taxTotal: number;
  taxPercentEffective: number;
  invoiceDiscount: number;
  subtotalBeforeRoundOff: number;
  roundOff: number;
  grandTotal: number;
}

function invoiceHeaderDiscount(invoice: InvoiceDetail): number {
  const da = (invoice.discountAmount ?? "").trim();
  const dp = (invoice.discountPercent ?? "").trim();
  const taxable = parseAmount(invoice.subTotal);
  if (da !== "" && parseAmount(da) > 0) return Math.max(0, parseAmount(da));
  if (dp !== "" && parseAmount(dp) > 0) {
    return (taxable * Math.min(100, Math.max(0, parseAmount(dp)))) / 100;
  }
  return 0;
}

/**
 * Derive display totals from the invoice header + lines. Uses `subTotal` as taxable amount (sum of
 * line taxable bases). Does not split tax by CGST/SGST/IGST — use `taxTotal` only.
 */
export function getInvoiceBillSummary(invoice: InvoiceDetail): InvoiceBillSummary {
  let grossAmount = 0;
  for (const item of invoice.items) {
    grossAmount += parseAmount(item.quantity) * parseAmount(item.unitPrice);
  }
  const taxableTotal = parseAmount(invoice.subTotal);
  const lineDiscountTotal = invoice.items.length > 0 ? Math.max(0, grossAmount - taxableTotal) : 0;

  const taxTotal = parseAmount(invoice.totalTax);
  const invoiceDiscount = invoiceHeaderDiscount(invoice);
  const subtotalBeforeRoundOff = Math.max(0, taxableTotal + taxTotal - invoiceDiscount);
  const roundOff = parseAmount(invoice.roundOffAmount);
  const grandTotal = parseAmount(invoice.totalAmount);
  const taxPercentEffective = taxableTotal > 0.000_5 ? (taxTotal / taxableTotal) * 100 : 0;

  return {
    grossAmount,
    lineDiscountTotal,
    taxableTotal,
    taxTotal,
    taxPercentEffective,
    invoiceDiscount,
    subtotalBeforeRoundOff,
    roundOff,
    grandTotal,
  };
}
