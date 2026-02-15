export type CreditNoteStatus = "DRAFT" | "FINAL";

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  partyName: string;
  amount: string;
  reason: string;
  status: CreditNoteStatus;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditNoteRequest {
  invoiceId: number;
  reason: string;
  amount: string;
}
