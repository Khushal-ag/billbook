export type PartyType = "CUSTOMER" | "SUPPLIER";

export interface Party {
  id: number;
  businessId: number;
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
}

export type LedgerEntryType = "OPENING_BALANCE" | "INVOICE" | "PAYMENT" | "CREDIT_NOTE";

export interface PartyLedgerEntry {
  entryType: LedgerEntryType;
  entryDate?: string;
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

export interface AdvancePayment {
  id: number;
  partyId: number;
  invoiceId: number | null;
  amount: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PartyListResponse {
  parties: Party[];
  count: number;
}
