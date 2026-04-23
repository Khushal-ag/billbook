import type { InvoiceType } from "@/types/invoice";
import type { ItemType } from "@/types/item";
import type { PartyType } from "@/types/party";
import type { OutboundPaymentCategory } from "@/types/outbound-payment";

/**
 * Central query key factories for TanStack Query — use for useQuery and invalidateQueries
 * so keys stay consistent across hooks and mutations.
 */
export const queryKeys = {
  invoices: {
    root: () => ["invoices"] as const,
    /** Matches any `["invoice", id]` detail query. */
    detailPrefix: () => ["invoice"] as const,
    list: (args: {
      page: number;
      pageSize: number;
      status: string | undefined;
      search: string | undefined;
      invoiceType: InvoiceType | undefined;
      partyId: number | undefined;
      queryStartDate: string | undefined;
      queryEndDate: string | undefined;
    }) =>
      [
        "invoices",
        args.page,
        args.pageSize,
        args.status,
        args.search,
        args.invoiceType,
        args.partyId,
        args.queryStartDate,
        args.queryEndDate,
      ] as const,
    detail: (id: number | undefined) => ["invoice", id] as const,
    nextNumberRoot: () => ["invoice-next-number"] as const,
    nextNumber: (invoiceDate: string, financialYear: string, invoiceType: InvoiceType) =>
      ["invoice-next-number", invoiceDate, financialYear, invoiceType] as const,
    pdf: (id: number | undefined) => ["invoice-pdf", id] as const,
    communications: (invoiceId: number | undefined) =>
      ["invoice-communications", invoiceId] as const,
  },

  items: {
    root: () => ["items"] as const,
    categories: () => ["items", "categories"] as const,
    unitsRoot: () => ["items", "units"] as const,
    units: (type: ItemType | undefined) => ["items", "units", type] as const,
    /** Prefix for all item list queries — use with setQueriesData / cancelQueries for optimistic updates. */
    listPrefix: () => ["items", "list"] as const,
    list: (args: {
      categoryId: number | undefined;
      search: string;
      limit: number | undefined;
      offset: number | undefined;
      includeInactive: boolean;
    }) =>
      [
        "items",
        "list",
        args.categoryId ?? "",
        args.search ?? "",
        args.limit ?? "",
        args.offset ?? "",
        args.includeInactive,
      ] as const,
    detail: (id: number | undefined) => ["items", "item", id] as const,
    stockEntriesRoot: () => ["items", "stock-entries"] as const,
    stockEntriesByItem: (itemId: number, query: string) =>
      ["items", "stock-entries", "by-item", itemId, query] as const,
    stockEntriesList: (args: {
      categoryId: number | undefined;
      search: string;
      limit: number;
      offset: number;
    }) =>
      [
        "items",
        "stock-entries",
        "list",
        args.categoryId ?? "",
        args.search ?? "",
        args.limit,
        args.offset,
      ] as const,
    stockEntry: (entryId: number | undefined) => ["items", "stock-entry", entryId] as const,
    /** Invalidate all `stockEntryMap` queries (e.g. after finalize changes batch ids on invoice lines). */
    stockEntryMapPrefix: () => ["items", "stock-entry-map"] as const,
    /** Invalidate all single-entry detail queries. */
    stockEntryDetailPrefix: () => ["items", "stock-entry"] as const,
    stockEntryMap: (uniqueEntryIds: number[]) =>
      ["items", "stock-entry-map", uniqueEntryIds] as const,
    /** Invalidate all GET /items/stock list queries. */
    stockPrefix: () => ["items", "stock"] as const,
    stockList: (params: {
      categoryId?: number;
      search?: string;
      limit?: number;
      offset?: number;
    }) => ["items", "stock", params] as const,
    ledger: (itemId: number | undefined) => ["items", "ledger", itemId] as const,
  },

  parties: {
    root: () => ["parties"] as const,
    ledgerPrefix: () => ["party-ledger"] as const,
    balancePrefix: () => ["party-balance"] as const,
    list: (args: {
      type: PartyType | undefined;
      includeInactive: boolean | undefined;
      search: string | undefined;
      limit: number | undefined;
      offset: number | undefined;
    }) =>
      ["parties", args.type, args.includeInactive, args.search, args.limit, args.offset] as const,
    detail: (id: number | undefined) => ["party", id] as const,
    consignees: (partyId: number | undefined) => ["party-consignees", partyId] as const,
    ledger: (partyId: number | undefined) => ["party-ledger", partyId] as const,
    /** Full GET /parties/:id/balance payload — must match `usePartyBalance` / list prefetch shape. */
    balance: (partyId: number | undefined) => ["party-balance", "detail", partyId] as const,
    statement: (
      partyId: number | undefined,
      format: string,
      startDate: string | undefined,
      endDate: string | undefined,
    ) => ["party-statement", partyId, format, startDate, endDate] as const,
  },

  receipts: {
    root: () => ["receipts"] as const,
    /** Matches any `["receipt", id]` detail query. */
    detailPrefix: () => ["receipt"] as const,
    list: (page: number, pageSize: number, partyId: number | undefined) =>
      ["receipts", page, pageSize, partyId] as const,
    detail: (receiptId: number | undefined) => ["receipt", receiptId] as const,
  },

  outboundPayments: {
    root: () => ["outbound-payments"] as const,
    list: (
      page: number,
      pageSize: number,
      category: OutboundPaymentCategory | "ALL" | undefined,
      partyId: number | undefined,
    ) => ["outbound-payments", page, pageSize, category, partyId] as const,
  },

  reports: {
    dashboard: (startDate: string, endDate: string) =>
      ["reports", "dashboard", startDate, endDate] as const,
    receiptRegister: (startDate: string, endDate: string, limit: number) =>
      ["reports", "receipt-register", startDate, endDate, limit] as const,
    invoiceRegister: (startDate: string, endDate: string, limit: number) =>
      ["reports", "invoice-register", startDate, endDate, limit] as const,
    debtRegister: (limit: number) => ["reports", "debt-register", limit] as const,
    payablesRegister: (limit: number) => ["reports", "payables-register", limit] as const,
    receivablesAging: (asOf: string, limit: number) =>
      ["reports", "receivables-aging", asOf, limit] as const,
    creditNoteRegister: (startDate: string, endDate: string, limit: number) =>
      ["reports", "credit-note-register", startDate, endDate, limit] as const,
    payoutRegister: (startDate: string, endDate: string, limit: number) =>
      ["reports", "payout-register", startDate, endDate, limit] as const,
  },

  tax: {
    gstSummary: (startDate: string, endDate: string) =>
      ["tax", "gst-summary", startDate, endDate] as const,
    itemized: (startDate: string, endDate: string) =>
      ["tax", "itemized", startDate, endDate] as const,
    gstExport: (startDate: string, endDate: string) =>
      ["tax", "gst-export", startDate, endDate] as const,
  },

  auditLogs: {
    list: (page: number, pageSize: number, action: string | undefined) =>
      ["audit-logs", page, pageSize, action] as const,
    resource: (resourceType: string, resourceId: number | undefined) =>
      ["audit-logs", "resource", resourceType, resourceId] as const,
  },

  alerts: {
    root: () => ["alerts"] as const,
    list: (unreadOnly: boolean, limit?: number) =>
      ["alerts", unreadOnly, limit ?? "default"] as const,
  },

  creditNotes: {
    root: () => ["credit-notes"] as const,
    list: (invoiceId: number | undefined, page?: number, pageSize?: number) =>
      ["credit-notes", invoiceId, page, pageSize] as const,
    detail: (creditNoteId: number | undefined) => ["credit-notes", "detail", creditNoteId] as const,
  },

  admin: {
    businesses: (limit: number, offset: number) => ["admin", "businesses", limit, offset] as const,
    transactions: (
      startDate: string,
      endDate: string,
      limit: number,
      offset: number,
      businessId: number | undefined,
    ) => ["admin", "transactions", startDate, endDate, limit, offset, businessId ?? ""] as const,
  },

  business: {
    dashboard: () => ["dashboard"] as const,
    profile: () => ["business-profile"] as const,
    businessTypes: () => ["business-type-options"] as const,
    industryTypes: () => ["industry-type-options"] as const,
    users: () => ["business-users"] as const,
    settings: () => ["business-settings"] as const,
    roleGroups: () => ["business-role-groups"] as const,
    roleGroup: (id: number | undefined) => ["business-role-groups", id] as const,
    permissionCatalog: () => ["business-permission-catalog"] as const,
  },
} as const;
