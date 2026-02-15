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
