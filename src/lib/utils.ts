import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitalise the first letter of each word. Use for category, vendor, unit, and item names.
 */
export function capitaliseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Format a number or numeric string (en-IN locale, 2 decimal places). No currency symbol.
 * Handles comma-separated strings from the API. Use for currency/cost (with formatCurrency).
 */
export function formatNumber(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format a number with decimals only when the value has a decimal part (e.g. 100 → "100", 99.5 → "99.5").
 * Use for quantities, counts, and non-currency numbers. For cost/money use formatCurrency.
 */
export function formatQuantity(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "0";
  if (Number.isInteger(num)) {
    return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  return num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * Format a numeric string or number as Indian Rupee currency.
 * Handles comma-separated strings from the API.
 */
export function formatCurrency(value: string | number): string {
  return `₹${formatNumber(value)}`;
}

/**
 * Build a URL query string from a params object, filtering out undefined/null/empty values.
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

/**
 * Format a date string (ISO date or datetime) to human-readable format (e.g., "16 Feb 2026").
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * Format a date string to month year format (e.g., "Feb 2026").
 */
export function formatMonthYear(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * Download data as a JSON file.
 */
export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a human-readable HTML sales report from export data.
 */
export function generateSalesReportHTML(exportData: {
  period: { startDate: string; endDate: string };
  data: Array<{
    date: string;
    invoiceNumber: string;
    partyName: string;
    totalAmount: string;
    totalTax: string;
    paidAmount: string;
    outstanding: string;
    status: string;
  }>;
  summary: {
    totalInvoices: number;
    totalAmount: string;
    totalTax: string;
    totalPaid: string;
    totalOutstanding: string;
  };
  exportedAt: string;
}): string {
  const startDate = formatDate(exportData.period.startDate);
  const endDate = formatDate(exportData.period.endDate);
  const exportedDate = formatDate(exportData.exportedAt);

  const tableRows = exportData.data
    .map(
      (row) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${row.invoiceNumber}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${row.partyName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${formatDate(row.date)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${row.totalAmount}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${row.totalTax}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${row.paidAmount}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${row.outstanding}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;"><span style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${row.status}</span></td>
    </tr>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      background-color: #f9fafb;
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .header p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-box {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .summary-box h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .summary-box p {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background-color: #f3f4f6;
    }
    thead th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #666;
      font-size: 12px;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sales Report</h1>
      <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
      <p><strong>Generated:</strong> ${exportedDate}, ${new Date(exportData.exportedAt).toLocaleTimeString("en-IN")}</p>
    </div>

    <div class="summary">
      <div class="summary-box">
        <h3>Total Invoices</h3>
        <p>${exportData.summary.totalInvoices}</p>
      </div>
      <div class="summary-box">
        <h3>Total Amount</h3>
        <p>₹${exportData.summary.totalAmount}</p>
      </div>
      <div class="summary-box">
        <h3>Total Tax</h3>
        <p>₹${exportData.summary.totalTax}</p>
      </div>
      <div class="summary-box">
        <h3>Total Paid</h3>
        <p>₹${exportData.summary.totalPaid}</p>
      </div>
      <div class="summary-box">
        <h3>Outstanding</h3>
        <p>₹${exportData.summary.totalOutstanding}</p>
      </div>
    </div>

    <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Invoice Details</h2>
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Party Name</th>
          <th>Date</th>
          <th style="text-align: right;">Amount</th>
          <th style="text-align: right;">Tax</th>
          <th style="text-align: right;">Paid</th>
          <th style="text-align: right;">Outstanding</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer">
      <p>This report was automatically generated. Please verify all amounts and details.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate a human-readable HTML GST report from export data.
 */
export function generateGSTReportHTML(exportData: {
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
}): string {
  const startDate = formatDate(exportData.period.startDate);
  const endDate = formatDate(exportData.period.endDate);
  const exportedDate = formatDate(exportData.exportedAt);

  const invoiceRows = exportData.invoices
    .map(
      (inv) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${inv.invoiceNumber}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${formatDate(inv.invoiceDate)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${inv.cgstAmount}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${inv.sgstAmount}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${inv.igstAmount}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${inv.totalTax}</td>
    </tr>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      background-color: #f9fafb;
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .header p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-box {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    .summary-box h3 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .summary-box p {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead {
      background-color: #f3f4f6;
    }
    thead th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #666;
      font-size: 12px;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GST / Tax Report</h1>
      <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
      <p><strong>Generated:</strong> ${exportedDate}, ${new Date(exportData.exportedAt).toLocaleTimeString("en-IN")}</p>
    </div>

    <div class="summary">
      <div class="summary-box">
        <h3>Total CGST</h3>
        <p>₹${exportData.summary.totalCgst}</p>
      </div>
      <div class="summary-box">
        <h3>Total SGST</h3>
        <p>₹${exportData.summary.totalSgst}</p>
      </div>
      <div class="summary-box">
        <h3>Total IGST</h3>
        <p>₹${exportData.summary.totalIgst}</p>
      </div>
      <div class="summary-box">
        <h3>Total Invoices</h3>
        <p>${exportData.invoiceCount}</p>
      </div>
    </div>

    <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Tax Breakdown by Invoice</h2>
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th style="text-align: right;">CGST</th>
          <th style="text-align: right;">SGST</th>
          <th style="text-align: right;">IGST</th>
          <th style="text-align: right;">Total Tax</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceRows}
      </tbody>
    </table>

    <div class="footer">
      <p>This report is for GST filing purposes. Please verify all amounts before submission.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Download HTML content as an HTML file.
 */
export function downloadHTML(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
