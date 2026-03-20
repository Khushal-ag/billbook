import type { ReceiptSummary } from "./receipt";

export type PartyType = "CUSTOMER" | "SUPPLIER";

export interface Party {
  id: number;
  businessId: number;
  /** e.g. P-00001 — generated on create (API) */
  partyCode?: string;
  name: string;
  type: PartyType;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  openingBalance: string | null;
  contactPersonName?: string | null;
  contactPersonMobile?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyRequest {
  name: string;
  type?: PartyType;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  openingBalance?: string;
  contactPersonName?: string | null;
  contactPersonMobile?: string | null;
  isActive?: boolean;
}

export type LedgerEntryType = "OPENING_BALANCE" | "INVOICE" | "PAYMENT" | "CREDIT_NOTE";

export interface PartyLedgerEntry {
  entryType: LedgerEntryType;
  entryDate?: string;
  createdAt?: string;
  debitAmount?: string;
  creditAmount?: string;
  runningBalance: string;
  referenceId?: number;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface PartyLedgerResponse {
  openingBalance: string;
  currentBalance: string;
  totalDebits: string;
  totalCredits: string;
  entries: PartyLedgerEntry[];
}

export interface PartyBalanceResponse {
  currentBalance: string;
  receivable: string;
  advance: string;
}

export interface PartyStatementPeriod {
  startDate: string;
  endDate: string;
  days: number;
}

export interface PartyStatementResponse {
  openingBalance: string;
  closingBalance: string;
  totals: { debit: string; credit: string };
  entries: PartyLedgerEntry[];
  period: PartyStatementPeriod;
}

export interface PartyStatementPdfResponse {
  partyId: number;
  downloadUrl: string | null;
  format: "pdf";
  storageConfigured: boolean;
  generatedAt?: string;
  period: PartyStatementPeriod;
  openingBalance: string;
  closingBalance: string;
  totals: { debit: string; credit: string };
}

export interface PartyAdvancePaymentRequest {
  amount: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

/** POST /parties/:id/payments — receipt created (full or partial shape). */
export interface PartyAdvanceReceiptResult {
  receipt?: ReceiptSummary;
  receiptId?: number;
  receiptNumber?: string;
  totalAmount?: string;
  allocatedAmount?: string;
  unallocatedAmount?: string;
  paymentMethod?: string;
  partyId?: number;
}

export interface PartyListResponse {
  parties: Party[];
  /** Number of items in the current page (not total; no total for full result set when using limit/offset) */
  count: number;
}
