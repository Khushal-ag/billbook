/**
 * User-facing report names and copy. API routes and paths stay the same; only labels change.
 */

export const reportHub = {
  title: "Reports",
  description:
    "Choose dates for activity totals, then open a report to see details or download a CSV file.",
} as const;

export const reportDashboard = {
  sectionActivity: "In this period",
  sectionActivityDescription: "Receipts, invoices, and payouts that fall in the range above.",
  sectionBalances: "Money owed",
  sectionBalancesDescription:
    "Current receivables and payables from each party’s account—independent of the date range above.",
  kpiReceipts: "Customer receipts",
  kpiInvoices: "Sales & purchases",
  kpiPayouts: "Payouts",
  balanceReceivablesTitle: "Outstanding receivables",
  balanceReceivablesTooltip:
    "Total amount customers and other parties owe you right now, from their running balances.",
  balancePayablesTitle: "Outstanding payables",
  balancePayablesTooltip:
    "Total amount you owe vendors and other parties right now, from their running balances.",
  receivablesMeta: (count: number) =>
    `${count} ${count === 1 ? "party" : "parties"} with a balance`,
  payablesMeta: (count: number) => `${count} ${count === 1 ? "party" : "parties"} you owe`,
  viewReportCta: "View report",
} as const;

export const reportReceiptRegister = {
  title: "Customer receipts",
  description: "Money received from customers in the selected period.",
  loadError: "Failed to load customer receipts",
  csvFilename: "customer-receipts.csv",
} as const;

export const reportItemRegister = {
  title: "Item register",
  description: "Current stock summarized by item — quantity, values, and status.",
  loadError: "Failed to load stock by item",
} as const;

export const reportInvoiceRegister = {
  title: "Sales & purchase invoices",
  description: "All invoices dated in the selected period.",
  loadError: "Failed to load invoice list",
  csvFilename: "sales-and-purchase-invoices.csv",
} as const;

export const reportPayoutRegister = {
  title: "Payouts",
  description:
    "Money you paid out in the selected period — suppliers, parties, refunds on returns, and expenses.",
  loadError: "Failed to load payouts",
  csvFilename: "payments-out.csv",
} as const;

export const reportDebtRegister = {
  title: "Outstanding receivables",
  description: "How much each party still owes you (their current balance).",
  loadError: "Failed to load outstanding receivables",
  csvFilename: "outstanding-receivables.csv",
  summaryTotalLabel: "Total owed to you",
  summaryParties: (count: number) => `${count} ${count === 1 ? "party" : "parties"} with a balance`,
  emptyMessage: "No outstanding balances.",
} as const;

export const reportPayablesRegister = {
  title: "Outstanding payables",
  description: "How much you owe each party (their current balance).",
  loadError: "Failed to load outstanding payables",
  csvFilename: "outstanding-payables.csv",
  summaryTotalLabel: "Total you owe",
  summaryParties: (count: number) => `${count} ${count === 1 ? "party" : "parties"} you owe`,
  emptyMessage: "Nothing owed right now.",
} as const;

export const reportCreditNoteRegister = {
  title: "Credit notes",
  description: "Credit notes issued in the selected period (returns and adjustments).",
  loadError: "Failed to load credit notes",
  csvFilename: "credit-notes.csv",
} as const;

export const reportInvoiceAging = {
  title: "Invoice aging",
  description: "Unpaid sales invoices grouped by how long they have been open.",
  loadError: "Failed to load invoice aging",
  csvFilename: "invoice-aging.csv",
  navLabel: "Invoice aging",
  /** Shown after the as-of date on the aging report body. */
  asOfLineOutstandingPrefix: "Total outstanding",
  chartTitle: "Outstanding by age",
  tableColumnAge: "Age",
  tableColumnOutstanding: "Outstanding",
  emptyBucket: "No invoices in this age group.",
} as const;
