import type { CreditNoteSummary } from "@/types/credit-note";

/** Resolved party id for links and fallbacks (party object or top-level id). */
export function resolvedCreditNotePartyId(cn: CreditNoteSummary): number | null {
  const fromParty = cn.party?.partyId;
  if (fromParty != null && Number.isFinite(Number(fromParty))) {
    return Number(fromParty);
  }
  if (cn.partyId != null && Number.isFinite(Number(cn.partyId))) {
    return Number(cn.partyId);
  }
  return null;
}

/** Party column / summary: `party.partyName` only; em dash when missing. */
export function creditNotePartyNameDisplay(cn: CreditNoteSummary): string {
  return cn.party?.partyName?.trim() || "—";
}

/** Props for LinkedInvoiceLink: prefer `sourceInvoiceNumber`, then `invoiceNumber`. */
export function creditNoteSourceInvoiceLinkProps(cn: CreditNoteSummary): {
  invoiceId?: number;
  invoiceNumber?: string | null;
} {
  const raw = cn.invoiceId;
  const invoiceId = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : undefined;
  const invoiceNumber = cn.sourceInvoiceNumber?.trim() || cn.invoiceNumber?.trim() || null;
  return { invoiceId, invoiceNumber };
}
