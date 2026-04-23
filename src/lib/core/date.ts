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

/** Add calendar days to a YYYY-MM-DD string (local date). */
export function addCalendarDaysToIsoDate(isoDate: string, days: number): string | null {
  const d = parseISODateString(isoDate);
  if (!d) return null;
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return toISODateString(next);
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

/** Shared in-app date display (BillBook default). */
export const APP_DISPLAY_LOCALE = "en-IN";

export const appDisplayDateOnlyOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** `YYYY-MM-DD` (calendar date) → e.g. 11 Apr 2026 — use for filters / API period fields. */
export function formatAppDateOnlyFromYmd(isoYmd: string): string {
  return formatISODateDisplay(isoYmd, APP_DISPLAY_LOCALE, appDisplayDateOnlyOptions);
}

/** Any parseable ISO timestamp → date only, same style as {@link formatAppDateOnlyFromYmd}. */
export function formatAppDateFromInstant(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === "") return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return String(iso);
  return new Date(t).toLocaleDateString(APP_DISPLAY_LOCALE, appDisplayDateOnlyOptions);
}

/** ISO datetime (e.g. ledger `createdAt`) → same date style + local time (short). */
export function formatAppDateTimeFromIso(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleString(APP_DISPLAY_LOCALE, {
    ...appDisplayDateOnlyOptions,
    hour: "2-digit",
    minute: "2-digit",
  });
}
