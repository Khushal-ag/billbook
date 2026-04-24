import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * jsPDF standard 14 fonts are Latin-1 / WinAnsi — no ₹ (U+20B9) or Unicode minus.
 * Normalize table and header text so amounts and titles render correctly.
 */
function toPdfWinAnsiSafe(text: string): string {
  return String(text)
    .replace(/\u20b9/g, "Rs. ") // Indian rupee (ASCII; built-in PDF fonts lack U+20B9)
    .replace(/\u2212/g, "-") // Unicode minus (e.g. formatSignedCurrency)
    .replace(/\u2013/g, "-") // en dash (date ranges)
    .replace(/\u2014/g, "-"); // em dash
}

export type ClientReportTableExport = {
  reportTitle: string;
  subtitle?: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
};

function padRow(width: number, row: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < width; i++) out.push(String(row[i] ?? ""));
  return out;
}

function normalizeBody(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string[][] {
  const w = headers.length;
  return rows.map((r) => padRow(w, r));
}

/** Build `.xlsx` from header + body rows (strings). */
export function downloadReportExcel(payload: ClientReportTableExport & { filename: string }): void {
  const headers = [...payload.headers];
  const body = normalizeBody(payload.headers, payload.rows);
  const aoa = [headers, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const name = payload.filename.toLowerCase().endsWith(".xlsx")
    ? payload.filename
    : `${payload.filename}.xlsx`;
  XLSX.writeFile(wb, name);
}

/** Build a simple tabular PDF (multi-page when needed). */
export function downloadReportPdf(payload: ClientReportTableExport & { filename: string }): void {
  const headers = [...payload.headers].map(toPdfWinAnsiSafe);
  const body = normalizeBody(payload.headers, payload.rows).map((row) => row.map(toPdfWinAnsiSafe));
  const landscape = headers.length > 7;
  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const title = toPdfWinAnsiSafe(payload.reportTitle);
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  let y = 22;
  if (payload.subtitle) {
    doc.setFontSize(9);
    const subtitle = toPdfWinAnsiSafe(payload.subtitle);
    const lines = doc.splitTextToSize(subtitle, landscape ? 270 : 180);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  } else {
    y = 24;
  }

  autoTable(doc, {
    head: [headers],
    body,
    startY: y,
    styles: { fontSize: landscape ? 6.5 : 8, cellPadding: 1.5 },
    headStyles: { fillColor: [71, 85, 105] },
    margin: { left: 10, right: 10 },
    tableWidth: "auto",
    horizontalPageBreak: true,
  });

  const name = payload.filename.toLowerCase().endsWith(".pdf")
    ? payload.filename
    : `${payload.filename}.pdf`;
  doc.save(name);
}
