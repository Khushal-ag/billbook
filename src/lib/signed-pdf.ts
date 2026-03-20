import { api } from "@/api";
import { showErrorToast } from "@/lib/toast-helpers";

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
