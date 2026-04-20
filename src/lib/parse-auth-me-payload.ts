import type { AuthMeResponse } from "@/types/auth";

/**
 * Normalizes GET /auth/me JSON whether the envelope is `{ user, business }`, `{ data: { user, business } }`,
 * or `{ data: { data: { user, business } } }` (double-wrapped).
 */
export function parseAuthMePayload(raw: unknown): AuthMeResponse | null {
  if (!raw || typeof raw !== "object") return null;

  function tryAuthMe(candidate: unknown): AuthMeResponse | null {
    if (!candidate || typeof candidate !== "object") return null;
    const c = candidate as Record<string, unknown>;
    const u = c.user;
    const b = c.business;
    if (u && b && typeof u === "object" && typeof b === "object") {
      return candidate as AuthMeResponse;
    }
    return null;
  }

  const o = raw as Record<string, unknown>;
  return (
    tryAuthMe(raw) ??
    tryAuthMe(o.data) ??
    tryAuthMe(
      o.data && typeof o.data === "object" ? (o.data as Record<string, unknown>).data : null,
    )
  );
}
