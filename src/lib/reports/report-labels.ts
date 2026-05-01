/**
 * User-facing report names and copy. API routes and paths stay the same; only labels change.
 */

export const reportHub = {
  title: "Reports",
  description:
    "Choose dates for activity totals, then open a report to see details. Registers load up to a row limit (not paged); raise the limit in the filter card when you need more rows. Download CSV from the API, or PDF and Excel built from the rows shown (including your filters).",
} as const;

export const reportDashboard = {
  sectionActivity: "In this period",
  sectionActivityDescription:
    "Receipt register, sales & purchase invoices, and payment register totals for the date range above.",
  sectionBalances: "Money owed",
  sectionBalancesDescription:
    "Debt register and Payables register use each party’s current balance — independent of the date range above.",
  kpiReceipts: "Receipt register",
  kpiInvoices: "Invoices",
  kpiInvoicesSalesCta: "Sales register",
  kpiInvoicesPurchaseCta: "Purchase register",
  kpiPayouts: "Payment register",
  balanceReceivablesTitle: "Debt register",
  balanceReceivablesTooltip:
    "Total amount customers and other parties owe you right now, from their running balances.",
  balancePayablesTitle: "Payables register",
  balancePayablesTooltip:
    "Total amount you owe vendors and other parties right now, from their running balances.",
  receivablesMeta: (count: number) =>
    `${count} ${count === 1 ? "party" : "parties"} with a balance`,
  payablesMeta: (count: number) => `${count} ${count === 1 ? "party" : "parties"} you owe`,
  viewReportCta: "View report",
} as const;

export const reportReceiptRegister = {
  title: "Receipt register",
  description: "Money received from customers in the selected period.",
  loadError: "Failed to load receipt register",
  csvFilename: "receipt-register.csv",
  pdfFilename: "receipt-register.pdf",
  xlsxFilename: "receipt-register.xlsx",
} as const;

export const reportItemRegister = {
  title: "Item register",
  description: "Current stock summarized by item — quantity, values, and status.",
  loadError: "Failed to load stock by item",
} as const;

export const reportInvoiceRegister = {
  title: "Sales register",
  description: "Sales invoices and sales returns in the selected period.",
  loadError: "Failed to load sales register",
  csvFilename: "sales-register.csv",
  pdfFilename: "sales-register.pdf",
  xlsxFilename: "sales-register.xlsx",
} as const;

export const reportPurchaseRegister = {
  title: "Purchase register",
  description: "Purchase invoices and purchase returns in the selected period.",
  loadError: "Failed to load purchase register",
  csvFilename: "purchase-register.csv",
  pdfFilename: "purchase-register.pdf",
  xlsxFilename: "purchase-register.xlsx",
} as const;

export const reportPayoutRegister = {
  title: "Payment register",
  description:
    "Money you paid out in the selected period — suppliers, parties, refunds on returns, and expenses.",
  loadError: "Failed to load payment register",
  csvFilename: "payout-register.csv",
  pdfFilename: "payout-register.pdf",
  xlsxFilename: "payout-register.xlsx",
} as const;

export const reportDebtRegister = {
  title: "Debt register",
  description:
    "Outstanding sales invoices as of a date — totals, paid vs balance, days open, and ageing buckets (0–30, 31–60, 61–90, 90+ days).",
  loadError: "Failed to load debt register",
  csvFilename: "debt-register.csv",
  pdfFilename: "debt-register.pdf",
  xlsxFilename: "debt-register.xlsx",
  summaryTotalLabel: "Total outstanding",
  summaryParties: (count: number) => `${count} ${count === 1 ? "invoice" : "invoices"} in snapshot`,
  emptyMessage: "No rows match your filters.",
} as const;

export const reportPayablesRegister = {
  title: "Payables register",
  description: "Outstanding amounts you owe each party — their current payable balance.",
  loadError: "Failed to load payables register",
  csvFilename: "payables-register.csv",
  pdfFilename: "payables-register.pdf",
  xlsxFilename: "payables-register.xlsx",
  summaryTotalLabel: "Total you owe",
  summaryParties: (count: number) => `${count} ${count === 1 ? "party" : "parties"} you owe`,
  emptyMessage: "Nothing owed right now.",
} as const;

export const reportCreditNoteRegister = {
  title: "Credit notes",
  description: "Credit notes issued in the selected period (returns and adjustments).",
  loadError: "Failed to load credit notes",
  csvFilename: "credit-notes.csv",
  pdfFilename: "credit-notes.pdf",
  xlsxFilename: "credit-notes.xlsx",
} as const;

export const reportInvoiceAging = {
  title: "Invoice aging",
  description: "Unpaid sales invoices grouped by how long they have been open.",
  loadError: "Failed to load invoice aging",
  csvFilename: "invoice-aging.csv",
  pdfFilename: "invoice-aging.pdf",
  xlsxFilename: "invoice-aging.xlsx",
  navLabel: "Invoice aging",
  /** Shown after the as-of date on the aging report body. */
  asOfLineOutstandingPrefix: "Total outstanding",
  chartTitle: "Outstanding by age",
  tableColumnAge: "Age",
  tableColumnOutstanding: "Outstanding",
  emptyBucket: "No invoices in this age group.",
} as const;
