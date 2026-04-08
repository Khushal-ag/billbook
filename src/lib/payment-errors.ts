import { ApiClientError } from "@/api/error";

/** Append `details.maxPayable` when the API returns it (e.g. amount over balance). */
export function withPaymentCapHint(message: string, details: unknown): string {
  if (!details || typeof details !== "object") return message;
  const mp = (details as Record<string, unknown>).maxPayable;
  if (typeof mp === "string" && mp.trim()) {
    return `${message.trim()} Maximum payable: ${mp}.`;
  }
  return message;
}

export function augmentApiClientErrorForPayment(err: ApiClientError): ApiClientError {
  return new ApiClientError(
    withPaymentCapHint(err.message, err.details),
    err.status,
    err.details,
    err.requestId,
  );
}
