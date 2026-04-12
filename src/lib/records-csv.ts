/**
 * Build RFC 4180–style CSV in the browser (no server `format=csv` for admin APIs).
 */
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Stable column order: `priority` keys first (when present), then remaining keys sorted. */
export function recordsToCsv(
  rows: Record<string, unknown>[],
  priorityKeys: readonly string[],
): string {
  if (rows.length === 0) return "";

  const keySet = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) keySet.add(k);
  }

  const rest = [...keySet].filter((k) => !priorityKeys.includes(k)).sort();
  const headers = [...priorityKeys.filter((k) => keySet.has(k)), ...rest];

  const lines = [
    headers.map((h) => escapeCsvField(h)).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvField(row[h])).join(",")),
  ];
  return lines.join("\r\n");
}

export function downloadCsvText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
