import type { InvoiceDetail } from "@/types/invoice";
import type { Party, PartyConsignee } from "@/types/party";

/** Party line for compact UI (e.g. search dropdown): street + city, comma-separated. */
export function formatPartyCitySummary(party: Pick<Party, "address" | "city">): string {
  const parts = [party.address?.trim(), party.city?.trim()].filter((p): p is string => Boolean(p));
  return parts.join(", ");
}

/** Single-line party address: `address · city, state · pin` (matches invoice create consignee list). */
export function formatPartyAddressInline(
  party: Pick<Party, "address" | "city" | "state" | "postalCode"> | null | undefined,
): string {
  if (!party) return "";
  const cityState = [party.city?.trim(), party.state?.trim()].filter(Boolean).join(", ");
  return [party.address?.trim(), cityState, party.postalCode?.trim()].filter(Boolean).join(" · ");
}

/** Single-line consignee address for selects and previews. */
export function formatConsigneeAddressInline(consignee: PartyConsignee): string {
  const cityState = [consignee.city, consignee.state].filter(Boolean).join(", ");
  return [consignee.address?.trim(), cityState, consignee.postalCode?.trim()]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Invoice detail card: consignee snapshot if present, else party billing address;
 * two visual lines (street / area then city, state pin).
 */
export function formatInvoicePartyAddressLines(invoice: InvoiceDetail): string | null {
  const line1 = invoice.consigneeAddress?.trim() || invoice.partyAddress?.trim();
  const city = invoice.consigneeCity?.trim() || invoice.partyCity?.trim();
  const state = invoice.consigneeState?.trim() || invoice.partyState?.trim();
  const pin = invoice.consigneePostalCode?.trim() || invoice.partyPostalCode?.trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  const line2 = [cityState, pin].filter(Boolean).join(" ").trim();

  const lines = [line1, line2].filter((l): l is string => Boolean(l));
  return lines.length > 0 ? lines.join("\n") : null;
}
