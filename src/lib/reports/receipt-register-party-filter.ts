import type { Party } from "@/types/party";
import type { ReceiptRegisterRowDto } from "@/types/report";

/** When the API omits `partyId`, fall back to exact name match against the selected party. */
export function receiptRowMatchesCustomerParty(
  r: ReceiptRegisterRowDto,
  party: Party | null,
): boolean {
  if (!party) return true;
  if (typeof r.partyId === "number") return r.partyId === party.id;
  const rowName = (r.partyName ?? "").trim().toLowerCase();
  return rowName === party.name.trim().toLowerCase();
}
