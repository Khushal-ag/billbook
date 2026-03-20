import type { OutboundPaymentCategory } from "@/types/outbound-payment";

export const OUTBOUND_CATEGORY_LABELS: Record<OutboundPaymentCategory, string> = {
  SALE_RETURN_REFUND: "Sale return refund",
  PARTY_PAYMENT: "Party payment",
  EXPENSE: "Expense",
};

export const OUTBOUND_CATEGORY_OPTIONS: { value: OutboundPaymentCategory; label: string }[] = [
  { value: "SALE_RETURN_REFUND", label: OUTBOUND_CATEGORY_LABELS.SALE_RETURN_REFUND },
  { value: "PARTY_PAYMENT", label: OUTBOUND_CATEGORY_LABELS.PARTY_PAYMENT },
  { value: "EXPENSE", label: OUTBOUND_CATEGORY_LABELS.EXPENSE },
];
