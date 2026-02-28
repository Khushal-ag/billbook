/**
 * Parse YYYY-MM-DD string to Date. Returns undefined if invalid or empty.
 */
export function parseISODateString(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

/**
 * Format Date to YYYY-MM-DD string.
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format ISO date string for display. Returns empty string if invalid.
 * @param value - YYYY-MM-DD string
 * @param locale - e.g. "en-GB", "en-IN"
 * @param options - Intl.DateTimeFormatOptions (default: short date for en-IN)
 */
export function formatISODateDisplay(
  value: string,
  locale = "en-IN",
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  const dt = parseISODateString(value);
  if (!dt) return "";
  return dt.toLocaleDateString(locale, options);
}
