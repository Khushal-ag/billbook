import { toast } from "sonner";
import { ApiClientError } from "@/api/error";

function requestIdSuffix(requestId: string) {
  return `\n\nRequest ID: ${requestId} — share with support when reporting an issue.`;
}

function copyRequestIdAction(requestId: string) {
  return {
    label: "Copy ID",
    onClick: () => {
      void navigator.clipboard?.writeText(requestId).catch(() => {});
    },
  };
}

/**
 * Show a standardized error toast.
 * - showErrorToast(error, title): title as heading, error message as description
 * - showErrorToast(message): message only (single-arg call)
 * For `ApiClientError` with `requestId`, appends correlation text and a Copy ID action.
 */
export function showErrorToast(errorOrMessage: unknown, title?: string) {
  const requestId = errorOrMessage instanceof ApiClientError ? errorOrMessage.requestId : undefined;

  if (title !== undefined) {
    const base = errorOrMessage instanceof Error ? errorOrMessage.message : "Please try again.";
    toast.error(title, {
      description: requestId ? base + requestIdSuffix(requestId) : base,
      ...(requestId ? { action: copyRequestIdAction(requestId) } : {}),
    });
  } else {
    const message =
      typeof errorOrMessage === "string"
        ? errorOrMessage
        : errorOrMessage instanceof Error
          ? errorOrMessage.message
          : "Something went wrong.";
    const full = requestId ? message + requestIdSuffix(requestId) : message;
    toast.error(full, {
      ...(requestId ? { action: copyRequestIdAction(requestId) } : {}),
    });
  }
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}
