import { toast } from "sonner";

/**
 * Show a standardized error toast with error message extraction
 */
export function showErrorToast(error: unknown, title: string) {
  toast.error(title, {
    description: error instanceof Error ? error.message : "Please try again.",
  });
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
