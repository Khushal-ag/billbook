/**
 * Detects 403 responses where the API indicates the business user’s role group is inactive.
 * Used by the HTTP client (overlay) and error toasts (skip redundant permission refresh).
 */
export function isInactiveRoleGroupAccessMessage(message: string): boolean {
  const m = message.trim();
  return /role\s*group/i.test(m) && /inactive|deactivated|no\s*longer\s+active/i.test(m);
}
