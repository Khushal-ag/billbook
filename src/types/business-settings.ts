export type FinancialYearStartMonthSource = "business_settings" | "business_profile";

export interface BusinessSettingsData {
  invoicePrefix: string;
  invoiceSequenceStart: number;
  saleReturnPrefix: string;
  saleReturnSequenceStart: number;
  purchaseInvoicePrefix: string;
  purchaseInvoiceSequenceStart: number;
  purchaseReturnPrefix: string;
  purchaseReturnSequenceStart: number;
  receiptPrefix: string;
  receiptSequenceStart: number;
  paymentPrefix: string;
  paymentSequenceStart: number;
  defaultDueDays: number | null;
  /** Non-negative decimal string (e.g. "20.00") or null — default margin for purchase line selling price when line omits sellingPrice. */
  defaultSellingPriceMarginPercent?: string | null;
  financialYearStartMonth: number;
  financialYearStartMonthSource: FinancialYearStartMonthSource;
  businessProfileFinancialYearStart: number;
}

export interface UpdateBusinessSettingsRequest {
  invoicePrefix?: string | null;
  invoiceSequenceStart?: number | null;
  saleReturnPrefix?: string | null;
  saleReturnSequenceStart?: number | null;
  purchaseInvoicePrefix?: string | null;
  purchaseInvoiceSequenceStart?: number | null;
  purchaseReturnPrefix?: string | null;
  purchaseReturnSequenceStart?: number | null;
  receiptPrefix?: string | null;
  receiptSequenceStart?: number | null;
  paymentPrefix?: string | null;
  paymentSequenceStart?: number | null;
  defaultDueDays?: number | null;
  /** Non-negative decimal string, or null to clear the business default purchase margin. */
  defaultSellingPriceMarginPercent?: string | null;
  financialYearStartMonth?: number | null;
}
