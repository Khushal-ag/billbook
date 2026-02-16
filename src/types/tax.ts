export interface GSTSummaryData {
  period: { startDate: string; endDate: string };
  monthlyBreakdown: GSTMonthRow[];
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
}

export interface GSTMonthRow {
  month: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
  totalAmount: string;
  invoiceCount: number;
}

export interface GSTItemizedData {
  period: { startDate: string; endDate: string };
  data: GSTItemizedRow[];
}

export interface GSTItemizedRow {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  taxableAmount: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalTax: string;
}

export interface GSTExportData {
  period: { startDate: string; endDate: string };
  summary: {
    totalCgst: string;
    totalSgst: string;
    totalIgst: string;
  };
  invoices: Array<{
    invoiceNumber: string;
    invoiceDate: string;
    cgstAmount: string;
    sgstAmount: string;
    igstAmount: string;
    totalTax: string;
    totalAmount: string;
  }>;
  invoiceCount: number;
  exportedAt: string;
}
