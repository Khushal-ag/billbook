import { ApiClientError } from "@/api/error";
import { formatCurrency } from "@/lib/core/utils";

/**
 * Enrich receipt create / allocation 400 responses when the API sends structured `details`
 * (e.g. opening cap: maxAmount, partyNetOpening, alreadySettledOnOtherReceipts).
 */
export function augmentApiClientErrorForReceipt(err: ApiClientError): ApiClientError {
  return new ApiClientError(
    withReceiptErrorDetails(err.message, err.details),
    err.status,
    err.details,
    err.requestId,
  );
}

function withReceiptErrorDetails(message: string, details: unknown): string {
  if (!details || typeof details !== "object" || Array.isArray(details)) return message;
  const d = details as Record<string, unknown>;
  const maxAmount = typeof d.maxAmount === "string" && d.maxAmount.trim() ? d.maxAmount.trim() : "";
  const partyNet =
    typeof d.partyNetOpening === "string" && d.partyNetOpening.trim()
      ? d.partyNetOpening.trim()
      : "";
  const other =
    typeof d.alreadySettledOnOtherReceipts === "string" && d.alreadySettledOnOtherReceipts.trim()
      ? d.alreadySettledOnOtherReceipts.trim()
      : "";

  const parts: string[] = [message.trim()];
  if (maxAmount) {
    parts.push(`Maximum you can tag against opening balance here: ${formatCurrency(maxAmount)}.`);
  }
  if (partyNet) {
    parts.push(`Party net opening (receivable): ${formatCurrency(partyNet)}.`);
  }
  if (other) {
    parts.push(`Already tagged on other receipts: ${formatCurrency(other)}.`);
  }
  return parts.filter(Boolean).join("\n");
}
