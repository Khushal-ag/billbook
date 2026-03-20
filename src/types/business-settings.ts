export type FinancialYearStartMonthSource = "business_settings" | "business_profile";

export interface BusinessSettingsData {
  invoicePrefix: string;
  invoiceSequenceStart: number;
  receiptPrefix: string;
  receiptSequenceStart: number;
  paymentPrefix: string;
  paymentSequenceStart: number;
  defaultDueDays: number | null;
  financialYearStartMonth: number;
  financialYearStartMonthSource: FinancialYearStartMonthSource;
  businessProfileFinancialYearStart: number;
}

export interface UpdateBusinessSettingsRequest {
  invoicePrefix?: string | null;
  invoiceSequenceStart?: number | null;
  receiptPrefix?: string | null;
  receiptSequenceStart?: number | null;
  paymentPrefix?: string | null;
  paymentSequenceStart?: number | null;
  defaultDueDays?: number | null;
  financialYearStartMonth?: number | null;
}
