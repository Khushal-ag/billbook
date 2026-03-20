export type OutboundPaymentCategory = "SALE_RETURN_REFUND" | "PARTY_PAYMENT" | "EXPENSE";

export interface OutboundPayment {
  id: number;
  paymentNumber: string;
  category: OutboundPaymentCategory;
  amount: string;
  paymentMethod: string;
  partyId?: number | null;
  partyName?: string | null;
  invoiceId?: number | null;
  payeeName?: string | null;
  expenseCategory?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface OutboundPaymentListResponse {
  payments: OutboundPayment[];
  page: number;
  pageSize: number;
  count: number;
}

export interface CreateOutboundPaymentBase {
  amount: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface CreateSaleReturnRefundRequest extends CreateOutboundPaymentBase {
  category: "SALE_RETURN_REFUND";
  partyId: number;
  invoiceId: number;
}

export interface CreatePartyPaymentRequest extends CreateOutboundPaymentBase {
  category: "PARTY_PAYMENT";
  partyId: number;
}

export interface CreateExpensePaymentRequest extends CreateOutboundPaymentBase {
  category: "EXPENSE";
  payeeName: string;
  expenseCategory?: string;
}

export type CreateOutboundPaymentRequest =
  | CreateSaleReturnRefundRequest
  | CreatePartyPaymentRequest
  | CreateExpensePaymentRequest;
