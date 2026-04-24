import type { InvoiceStatus, InvoiceType } from "./invoice";

export interface ReportPeriod {
  startDate: string;
  endDate: string;
}

/** GET /reports/dashboard */
export interface ReportsDashboardData {
  period: ReportPeriod;
  receipts: { count: number; totalAmount: string };
  invoices: { count: number; totalAmount: string };
  payouts: { count: number; totalAmount: string };
  debt: { totalReceivable: string; debtorCount: number };
  payables: { totalPayable: string; creditorCount: number };
}

export interface ReceiptRegisterRowDto {
  id: number;
  receiptNumber: string;
  partyId?: number;
  partyName?: string;
  totalAmount: string;
  /**
   * Invoice-line allocations only on some report APIs; when so, `allocatedAmount` + `unallocatedAmount`
   * ≈ `totalAmount` and opening is only in `openingBalanceSettlementAmount`. Other APIs sum both into `allocatedAmount`.
   */
  allocatedAmount?: string;
  unallocatedAmount: string;
  openingBalanceSettlementAmount?: string | null;
  paymentMethod: string;
  referenceNumber?: string | null;
  /** Invoice number(s) from the report when not the same field as {@link referenceNumber}. */
  linkedInvoiceSummary?: string | null;
  notes?: string | null;
  receivedAt: string;
  createdAt: string;
}

export interface ReceiptRegisterData {
  period: ReportPeriod;
  limit: number;
  receipts: ReceiptRegisterRowDto[];
}

export interface InvoiceRegisterRowDto {
  id: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  partyId: number;
  partyName?: string;
  invoiceDate: string;
  dueDate?: string | null;
  totalAmount: string;
  paidAmount?: string | null;
  dueAmount?: string;
  consigneeName?: string | null;
  consigneeCity?: string | null;
  consigneeState?: string | null;
}

export interface InvoiceRegisterData {
  period: ReportPeriod;
  limit: number;
  invoices: InvoiceRegisterRowDto[];
}

export interface DebtRegisterPartyRow {
  partyId: number;
  partyName: string;
  type: string;
  openingBalance: string;
  totalInvoiced: string;
  totalPaid: string;
  totalCredited: string;
  outstanding: string;
}

export interface DebtRegisterData {
  limit: number;
  parties: DebtRegisterPartyRow[];
  summary: { debtorCount: number; totalReceivable: string };
}

export interface PayablesRegisterPartyRow {
  partyId: number;
  partyName: string;
  type: string;
  openingBalance: string;
  totalInvoiced: string;
  totalPaid: string;
  totalCredited: string;
  payableAmount: string;
}

export interface PayablesRegisterData {
  limit: number;
  parties: PayablesRegisterPartyRow[];
  summary: { creditorCount: number; totalPayable: string };
}

export type ReceivablesAgingBucket =
  | "CURRENT"
  | "DAYS_1_30"
  | "DAYS_31_60"
  | "DAYS_61_90"
  | "DAYS_91_PLUS";

export interface ReceivablesAgingLine {
  invoiceId: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  partyId: number;
  partyCode?: string | null;
  partyName: string;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: string;
  /** Linked sale returns — when the aging API includes it (else treat as 0). */
  returnAmount?: string | null;
  paidAmount: string;
  dueAmount: string;
  daysPastDue: number;
  agingBucket: ReceivablesAgingBucket;
}

export interface ReceivablesAgingData {
  asOf: string;
  limit: number;
  lines: ReceivablesAgingLine[];
  summary: {
    current: string;
    days1to30: string;
    days31to60: string;
    days61to90: string;
    days91plus: string;
    totalDue: string;
  };
}

export interface CreditNoteRegisterRowDto {
  id: number;
  creditNoteNumber: string;
  status: string;
  invoiceId?: number | null;
  invoiceNumber?: string | null;
  partyId?: number | null;
  partyName?: string | null;
  totalAmount: string;
  affectsInventory?: boolean;
  createdAt: string;
}

export interface CreditNoteRegisterData {
  period: ReportPeriod;
  limit: number;
  creditNotes: CreditNoteRegisterRowDto[];
}

export interface PayoutRegisterRowDto {
  id: number;
  /** Current API: e.g. PAY-000001 */
  paymentNumber?: string;
  /** Legacy name if backend still sends it */
  payoutNumber?: string;
  financialYear?: string;
  /** Current API: e.g. SALE_RETURN_REFUND */
  paymentCategory?: string;
  /** Legacy name if backend still sends it */
  category?: string;
  partyId?: number | null;
  partyName?: string | null;
  invoiceId?: number | null;
  payeeName?: string | null;
  expenseCategory?: string | null;
  amount: string;
  paymentMethod?: string;
  referenceNumber?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface PayoutRegisterData {
  period: ReportPeriod;
  limit: number;
  payouts: PayoutRegisterRowDto[];
}
