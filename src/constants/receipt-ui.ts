import { cn } from "@/lib/core/utils";

/** Display labels for receipt / payment method codes */
export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank",
  CARD: "Card",
  /** Customer opening advance (from party setup). */
  OPENING_BALANCE: "Opening advance",
};

/** Distinct badge styling for system-generated opening receipts. */
export function receiptPaymentMethodBadgeClass(method: string): string {
  if (method === "OPENING_BALANCE") {
    return "border-violet-500/45 bg-violet-500/10 text-violet-900 dark:text-violet-100";
  }
  return "";
}

export function receiptPaymentMethodBadgeProps(method: string): {
  className: string;
  title?: string;
} {
  const base = "font-normal";
  const extra = receiptPaymentMethodBadgeClass(method);
  return {
    className: cn(base, extra),
    title:
      method === "OPENING_BALANCE"
        ? "Recorded when the customer was set up with an opening advance."
        : undefined,
  };
}
