import { api } from "./client";
import { buildQueryString } from "@/lib/core/utils";

/**
 * Parse RFC 5987 / simple `filename="..."` from Content-Disposition.
 */
function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=(?:UTF-8''|)([^;\n]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^["']|["']$/g, ""));
    } catch {
      return utf8[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  const simple = /filename="([^"]+)"/i.exec(header);
  if (simple?.[1]) return simple[1];
  const loose = /filename=([^;\s]+)/i.exec(header);
  if (loose?.[1]) return loose[1].replace(/^["']|["']$/g, "");
  return null;
}

function triggerBlobDownload(blob: Blob, filename: string) {
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

/** GET report blob; `pathWithQuery` must already include `?` query string. */
export async function downloadReportBlob(pathWithQuery: string, fallbackFilename: string) {
  const { blob, contentDisposition } = await api.getBlob(pathWithQuery);
  const name = parseFilenameFromContentDisposition(contentDisposition) ?? fallbackFilename;
  triggerBlobDownload(blob, name);
}

export type ReportDownloadFormat = "csv" | "pdf" | "xlsx";

/** GET `/path?...&format=` for exports (CSV, PDF, Excel) when the API supports it. */
export async function downloadReportFile(
  reportPath: string,
  query: Record<string, string | number | boolean | undefined | null>,
  format: ReportDownloadFormat,
  fallbackFilename: string,
) {
  const qs = buildQueryString({ ...query, format });
  await downloadReportBlob(`${reportPath}?${qs}`, fallbackFilename);
}

/** GET report with `format=csv` and save using Content-Disposition filename when present. */
export async function downloadReportCsv(pathWithQuery: string, fallbackFilename: string) {
  await downloadReportBlob(pathWithQuery, fallbackFilename);
}
