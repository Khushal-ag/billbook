import { ApiClientError } from "@/api/error";
import type { Item } from "@/types/item";

export const ITEM_NAME_REQUIRED_ERROR = "Item name is required";
export const ITEM_NAME_DUPLICATE_ERROR = "Item already exists";

const DUPLICATE_ITEM_NAME_MESSAGE_PATTERN =
  /(?:item\s+with\s+this\s+name\s+already\s+exists|an\s+item\s+with\s+this\s+name\s+already\s+exists\.?|item\s+name\s+already\s+exists)/i;

export function normalizeItemName(name: string | null | undefined): string {
  return (name ?? "").trim();
}

export function normalizeItemNameForCompare(name: string | null | undefined): string {
  return normalizeItemName(name).toLowerCase();
}

export function isDuplicateItemName(
  candidateName: string,
  items: Item[],
  currentItemId?: number,
): boolean {
  const candidate = normalizeItemNameForCompare(candidateName);
  if (!candidate) return false;

  return items.some((existing) => {
    if (currentItemId != null && existing.id === currentItemId) {
      return false;
    }
    return normalizeItemNameForCompare(existing.name) === candidate;
  });
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const maybe = (error as { message?: unknown; error?: unknown }).message;
    if (typeof maybe === "string") return maybe;
    const fallback = (error as { message?: unknown; error?: unknown }).error;
    if (typeof fallback === "string") return fallback;
  }
  return "";
}

export function isDuplicateItemNameApiError(error: unknown): boolean {
  if (error instanceof ApiClientError && error.status === 409) {
    return true;
  }

  const message = extractErrorMessage(error);
  if (!message) return false;
  return DUPLICATE_ITEM_NAME_MESSAGE_PATTERN.test(message);
}
