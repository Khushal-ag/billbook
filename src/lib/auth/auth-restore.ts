import { api } from "@/api";
import { ApiClientError } from "@/api/error";
import { getAccessToken, getRefreshToken } from "@/api/token";
import type { AuthMeResponse, SessionUser } from "@/types/auth";
import { parseAuthMePayload } from "@/lib/auth/parse-auth-me-payload";
import { BILLBOOK_SESSION_KEY } from "@/constants/auth-storage";

function authMeFromEnvelope(res: unknown): AuthMeResponse | null {
  return parseAuthMePayload(res) ?? parseAuthMePayload((res as { data?: unknown }).data);
}

/** True if access or refresh token exists in storage (client-only). */
export function hasStoredCredentials(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAccessToken() || getRefreshToken());
}

/** Last committed user from GET /auth/me (or login fallback). Used for optimistic UI while validating. */
export function readCachedSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BILLBOOK_SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as SessionUser;
    if (typeof u?.id !== "number" || typeof u?.businessId !== "number") return null;
    return u;
  } catch {
    return null;
  }
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function shouldRetryAuthMeFailure(error: unknown, attempt: number, maxAttempts: number): boolean {
  if (attempt >= maxAttempts) return false;

  if (error instanceof ApiClientError) {
    if (error.status === 429) return true;
    if (error.status >= 500) return true;
    return false;
  }

  if (error instanceof TypeError) return true;

  if (error instanceof Error) {
    if (error.message === "Invalid /auth/me response") return false;
    const m = error.message.toLowerCase();
    if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) {
      return true;
    }
  }

  return false;
}

/**
 * GET /auth/me with retry for transient failures (network, 5xx, 429).
 * Does not retry 401/403 — the API client already handles refresh on 401 once.
 */
export async function fetchAuthMeValidated(maxAttempts = 3): Promise<AuthMeResponse> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await api.get<AuthMeResponse>("/auth/me");
      const me = authMeFromEnvelope(res);
      if (!me) throw new Error("Invalid /auth/me response");
      return me;
    } catch (e) {
      lastError = e;
      if (!shouldRetryAuthMeFailure(e, attempt, maxAttempts)) throw e;
      await delay(Math.min(350 * attempt, 1800));
    }
  }
  throw lastError;
}

export function isLikelyTransientRestoreFailure(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 429 || error.status >= 500;
  }
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const m = error.message.toLowerCase();
    return (
      m.includes("failed to fetch") ||
      m.includes("network") ||
      m.includes("load failed") ||
      m.includes("aborted")
    );
  }
  return false;
}
