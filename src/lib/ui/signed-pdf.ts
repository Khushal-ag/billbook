import { api } from "@/api";
import { parseFilenameFromContentDisposition, triggerBlobDownload } from "@/api/report-download";
import { showErrorToast } from "@/lib/ui/toast-helpers";

/**
 * Fetch a signed or public URL and save as a file (does not open a new tab).
 * Uses `Content-Disposition` filename when the server sends it.
 */
export async function downloadFileFromUrl(url: string, fallbackFilename: string): Promise<void> {
  const res = await fetch(url, { credentials: "omit", mode: "cors" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  const cd = res.headers.get("content-disposition");
  const name = parseFilenameFromContentDisposition(cd) ?? fallbackFilename;
  const blob = await res.blob();
  triggerBlobDownload(blob, name);
}

async function blobIsPdf(blob: Blob, filename: string): Promise<boolean> {
  if (/\.pdf$/i.test(filename)) return true;
  const type = blob.type.toLowerCase();
  if (type.includes("pdf")) return true;
  if (type.includes("html")) return false;
  const head = await blob.slice(0, 5).text();
  return head.startsWith("%PDF");
}

/**
 * Download to disk, then open a new tab with a **blob** preview only for real PDFs.
 * Avoids `window.open(signedUrl)` which may show raw HTML/text for HTML templates.
 */
export async function downloadFileFromUrlAndOpenPdfPreview(
  url: string,
  fallbackFilename: string,
): Promise<void> {
  const res = await fetch(url, { credentials: "omit", mode: "cors" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  const cd = res.headers.get("content-disposition");
  const name = parseFilenameFromContentDisposition(cd) ?? fallbackFilename;
  const blob = await res.blob();
  triggerBlobDownload(blob, name);
  if (await blobIsPdf(blob, name)) {
    const previewUrl = URL.createObjectURL(blob);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 180_000);
  }
}

/** GET …/pdf then open signed URL in a new tab. */
export async function openSignedPdfFromApiPath(
  apiPath: string,
  messages: { unavailable: string; failed: string },
): Promise<void> {
  try {
    const res = await api.get<{ downloadUrl?: string | null }>(apiPath);
    const url = res.data?.downloadUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else showErrorToast(messages.unavailable);
  } catch (e) {
    showErrorToast(e, messages.failed);
  }
}
