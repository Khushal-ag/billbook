export type CreditNoteStatus = "DRAFT" | "FINAL";

export interface CreditNote {
  id: number;
  businessId: number;
  invoiceId: number;
  creditNoteNumber: string;
  amount: string;
  reason: string | null;
  affectsInventory: boolean;
  status: CreditNoteStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCreditNoteRequest {
  invoiceId: number;
  amount: string;
  reason?: string;
  affectsInventory?: boolean;
}

/** GET /credit-notes response */
export interface CreditNoteListResponse {
  creditNotes: CreditNote[];
  count: number;
}
