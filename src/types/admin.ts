/** GET /admin/businesses — item shape from API */
export interface AdminBusinessListItem {
  id: number;
  businessName: string;
  ownerName: string | null;
  contactNo: string | null;
  joiningDate: string;
  validityEnd: string | null;
  organizationCode: string;
}

export interface AdminBusinessesResponse {
  items: AdminBusinessListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExtendValidityBody {
  additionalDays: number;
  remarks: string;
}

/** GET /admin/transactions — success `data` payload */
export interface AdminTransactionsPeriod {
  startDate: string;
  endDate: string;
}

/** GET /admin/transactions — one ledger row (party ledger / cross-tenant view). */
export interface AdminTransactionRow {
  id: number;
  businessId: number;
  businessName: string;
  organizationCode: string;
  kind: string;
  amount: string;
  partyId: number;
  partyName: string;
  referenceType: string;
  referenceId: number;
  invoiceType: string | null;
  invoiceNumber: string | null;
  paymentCategory: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  payeeName: string | null;
  expenseCategory: string | null;
  partyLedgerEntryId: number;
  createdAt: string;
}

export interface AdminTransactionsData {
  period: AdminTransactionsPeriod;
  limit: number;
  offset: number;
  total: number;
  transactions: AdminTransactionRow[];
}
