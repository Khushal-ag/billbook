export interface BalanceSummary {
  current: string;
  receivable: string;
  advance: string;
}

export interface LedgerEntry {
  entryDate?: string;
  entryType: string;
  debitAmount?: string;
  creditAmount?: string;
  runningBalance: string;
}

export interface StatementJsonData {
  openingBalance: string;
  closingBalance: string;
  totals: {
    debit: string;
    credit: string;
  };
  entries: LedgerEntry[];
}

export interface StatementPdfData {
  format: string;
  storageConfigured: boolean;
  downloadUrl?: string | null;
}
