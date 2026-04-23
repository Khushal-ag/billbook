/**
 * Display helpers for party ledger signed amounts.
 * Convention (aligned with opening balance): positive = debit balance, negative = credit balance.
 */

import { formatCurrency } from "@/lib/core/utils";

export type PartyLedgerBalanceNature = "DEBIT" | "CREDIT" | "ZERO";

const EPS = 1e-6;

export function parsePartyLedgerAmount(raw: string | null | undefined): number {
  const n = parseFloat(String(raw ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function partyLedgerBalanceNature(n: number): PartyLedgerBalanceNature {
  if (Math.abs(n) < EPS) return "ZERO";
  return n > 0 ? "DEBIT" : "CREDIT";
}

/** One-line amount + status for compact summaries (e.g. statement strip — avoids flex layouts inside prose). */
export function partyLedgerBalanceInlineParts(raw: string | null | undefined): {
  amountStr: string;
  label: string;
  labelClassName: string;
} {
  const n = parsePartyLedgerAmount(raw);
  const nature = partyLedgerBalanceNature(n);
  const amountStr = formatCurrency(Math.abs(n));
  if (nature === "ZERO") {
    return {
      amountStr,
      label: "Balanced",
      labelClassName: "text-xs font-medium text-muted-foreground",
    };
  }
  if (nature === "DEBIT") {
    return {
      amountStr,
      label: "Debit",
      labelClassName:
        "text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400",
    };
  }
  return {
    amountStr,
    label: "Credit",
    labelClassName:
      "text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400",
  };
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  OPENING_BALANCE: "Opening balance",
  INVOICE: "Invoice",
  PAYMENT: "Payment",
  CREDIT_NOTE: "Credit note",
};

/** Readable labels for ledger `entryType` enum values. */
export function formatLedgerEntryTypeLabel(entryType: string): string {
  if (ENTRY_TYPE_LABELS[entryType]) return ENTRY_TYPE_LABELS[entryType];
  return entryType
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}
