import type { OpenInvoiceForParty } from "@/types/receipt";

export type CreditNoteStatus = "DRAFT" | "FINAL";

/** List row / summary (no allocation breakdown). */
export interface CreditNoteSummary {
  id: number;
  businessId: number;
  invoiceId: number;
  /** When API embeds it: linked invoice display number. */
  invoiceNumber?: string | null;
  creditNoteNumber: string;
  amount: string;
  reason: string | null;
  /** Present on legacy rows only; new credit notes do not use inventory from this API flow. */
  affectsInventory?: boolean;
  status: CreditNoteStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreditNoteAllocation {
  id: number;
  invoiceId: number;
  amount: string;
  invoiceNumber?: string | null;
  createdAt: string;
}

/** GET/POST detail + PUT /allocations response. */
export interface CreditNoteDetail extends CreditNoteSummary {
  allocatedAmount?: string;
  unallocatedAmount?: string;
  allocations?: CreditNoteAllocation[];
  openInvoicesForParty?: OpenInvoiceForParty[];
}

export interface CreateCreditNoteRequest {
  invoiceId: number;
  amount: string;
  reason?: string;
}

export interface PutCreditNoteAllocationsRequest {
  allocations: { invoiceId: number; amount: string }[];
}

export interface CreditNoteListResponse {
  creditNotes: CreditNoteSummary[];
  count: number;
  limit?: number;
  offset?: number;
}
