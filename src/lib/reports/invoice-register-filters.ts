import type { InvoiceType } from "@/types/invoice";
import type { Party } from "@/types/party";
import type { InvoiceRegisterRowDto } from "@/types/report";

/** Tolerance for paid / due comparisons on invoice register rows. */
export const REGISTER_FLOAT_EPS = 0.001;

export type InvoiceRegisterPayStatusFilter = "ALL" | "PAID" | "UNPAID" | "PARTIAL";

export type InvoiceRegisterPayStatus = Exclude<InvoiceRegisterPayStatusFilter, "ALL">;

export function calcInvoiceRegisterPayStatus(
  totalAmount: string,
  paidAmount?: string | null,
  dueAmount?: string | undefined,
): InvoiceRegisterPayStatus {
  const total = Math.max(0, parseFloat(totalAmount || "0"));
  const paid = Math.max(0, parseFloat(paidAmount || "0"));
  const due =
    dueAmount !== undefined ? Math.max(0, parseFloat(dueAmount || "0")) : Math.max(0, total - paid);
  if (due <= REGISTER_FLOAT_EPS || paid >= total - REGISTER_FLOAT_EPS) return "PAID";
  if (paid <= REGISTER_FLOAT_EPS) return "UNPAID";
  return "PARTIAL";
}

export interface InvoiceRegisterRowFilterParams {
  allowedTypes: readonly InvoiceType[];
  docType: InvoiceType | "ALL";
  billNoTrimmed: string;
  party: Party | null;
  payStatus: InvoiceRegisterPayStatusFilter;
}

export function invoiceRegisterRowMatches(
  inv: InvoiceRegisterRowDto,
  p: InvoiceRegisterRowFilterParams,
): boolean {
  if (!p.allowedTypes.includes(inv.invoiceType)) return false;
  if (p.docType !== "ALL" && inv.invoiceType !== p.docType) return false;
  if (p.billNoTrimmed && !inv.invoiceNumber.toLowerCase().includes(p.billNoTrimmed.toLowerCase())) {
    return false;
  }
  if (p.party && inv.partyId !== p.party.id) return false;
  if (
    p.payStatus !== "ALL" &&
    calcInvoiceRegisterPayStatus(inv.totalAmount, inv.paidAmount ?? undefined, inv.dueAmount) !==
      p.payStatus
  ) {
    return false;
  }
  return true;
}

export function sumInvoiceRegisterRows(rows: InvoiceRegisterRowDto[]): {
  total: number;
  paid: number;
  balance: number;
} {
  return rows.reduce(
    (acc, inv) => ({
      total: acc.total + parseFloat(inv.totalAmount || "0"),
      paid: acc.paid + parseFloat(inv.paidAmount || "0"),
      balance: acc.balance + parseFloat(inv.dueAmount || "0"),
    }),
    { total: 0, paid: 0, balance: 0 },
  );
}

export function invoiceTypeRegisterLabel(type: InvoiceType): string {
  switch (type) {
    case "SALE_INVOICE":
      return "Sales invoice";
    case "SALE_RETURN":
      return "Sales return";
    case "PURCHASE_INVOICE":
      return "Purchase invoice";
    case "PURCHASE_RETURN":
      return "Purchase return";
  }
}
