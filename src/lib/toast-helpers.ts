import { toast } from "sonner";

/**
 * Show a standardized error toast.
 * - showErrorToast(error, title): title as heading, error message as description
 * - showErrorToast(message): message only (single-arg call)
 */
export function showErrorToast(errorOrMessage: unknown, title?: string) {
  if (title !== undefined) {
    toast.error(title, {
      description: errorOrMessage instanceof Error ? errorOrMessage.message : "Please try again.",
    });
  } else {
    const message =
      typeof errorOrMessage === "string"
        ? errorOrMessage
        : errorOrMessage instanceof Error
          ? errorOrMessage.message
          : "Something went wrong.";
    toast.error(message);
  }
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * Show a confirmation dialog using native confirm
 * Returns true if confirmed, false otherwise
 */
export function confirmAction(message: string): boolean {
  return confirm(message);
}
