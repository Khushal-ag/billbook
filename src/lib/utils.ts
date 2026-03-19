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
 * Format a datetime string to human-readable time (e.g., "03:42 PM").
 */
export function formatTime(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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

/** Compact numeric date for dense tables (e.g. DD/MM/YY). */
export function formatDateCompact(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}
