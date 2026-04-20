import type { ReceiptDetail } from "@/types/receipt";

function pickMoneyString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return undefined;
}

/**
 * Maps GET /receipts/:id (and similar) payloads to our camelCase shape. Supports snake_case and
 * alternate keys the API may return for opening-balance settlement context.
 */
export function normalizeReceiptDetail(raw: unknown): ReceiptDetail {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid receipt payload");
  }
  const o = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...o };

  const openingSettlement = pickMoneyString(
    o,
    "openingBalanceSettlementAmount",
    "opening_balance_settlement_amount",
  );
  if (openingSettlement != null) out.openingBalanceSettlementAmount = openingSettlement;

  const partyOpeningRemaining = pickMoneyString(
    o,
    "partyOpeningRemaining",
    "party_opening_remaining",
    "openingRemaining",
    "opening_remaining",
  );
  if (partyOpeningRemaining != null) out.partyOpeningRemaining = partyOpeningRemaining;

  const partyNetOpening = pickMoneyString(
    o,
    "partyNetOpening",
    "party_net_opening",
    "partyDebitOpening",
    "party_debit_opening",
    "netOpeningBalance",
    "net_opening_balance",
  );
  if (partyNetOpening != null) out.partyNetOpening = partyNetOpening;

  const partyOpeningSettledOnOtherReceipts = pickMoneyString(
    o,
    "partyOpeningSettledOnOtherReceipts",
    "party_opening_settled_on_other_receipts",
    "alreadySettledOnOtherReceipts",
    "already_settled_on_other_receipts",
    "openingSettledOnOtherReceipts",
    "opening_settled_on_other_receipts",
  );
  if (partyOpeningSettledOnOtherReceipts != null) {
    out.partyOpeningSettledOnOtherReceipts = partyOpeningSettledOnOtherReceipts;
  }

  return out as unknown as ReceiptDetail;
}
