import type { OpenInvoiceForParty } from "@/types/receipt";

export type CreditNoteStatus = "DRAFT" | "FINAL";

/** Embedded party summary on credit note list/detail (API: CreditNotePartySummary). */
export interface CreditNotePartySummary {
  partyId?: number | null;
  partyName?: string | null;
  partyCode?: string | null;
  partyGstin?: string | null;
  partyPhone?: string | null;
}

/** List row / summary (no allocation breakdown). */
export interface CreditNoteSummary {
  id: number;
  businessId: number;
  /** Source sale invoice id; may be absent on some responses (e.g. stripped joins). */
  invoiceId?: number | null;
  /** Human-readable number for the source invoice (preferred over invoiceNumber when both exist). */
  sourceInvoiceNumber?: string | null;
  /** When API embeds it: linked invoice display number (legacy / alias for source). */
  invoiceNumber?: string | null;
  /** Party row from API; may be null after delete or edge responses. */
  party?: CreditNotePartySummary | null;
  /** When the party object is omitted but the id is known. */
  partyId?: number | null;
  creditNoteNumber: string;
  amount: string;
  /** Total applied to invoices (when API sends it, e.g. list endpoint). */
  allocatedAmount?: string | null;
  /** Remaining credit not applied to invoices; if omitted, UI can derive from amount − allocatedAmount. */
  unallocatedAmount?: string;
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
