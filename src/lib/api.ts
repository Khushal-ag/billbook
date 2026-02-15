import type { ApiResponse } from "@/types/api";

const API_BASE = "/api";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

// ── Token management ────────────────────────────────────

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function getRefreshToken() {
  return refreshToken;
}

// ── Core fetch wrapper ──────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const { idempotencyKey, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  let response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  // Auto-refresh on 401
  if (response.status === 401 && accessToken) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });
    } catch {
      // Refresh failed — force logout handled by auth context
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiClientError(
      errorBody.error || `Request failed (${response.status})`,
      response.status,
      errorBody.details
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  if (!refreshToken) throw new Error("No refresh token");

  refreshPromise = fetch(`${API_BASE}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Refresh failed");
      const json = (await res.json()) as ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>;
      accessToken = json.data.tokens.accessToken;
      refreshToken = json.data.tokens.refreshToken;
      return json.data.tokens.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// ── Error class ─────────────────────────────────────────

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

// ── HTTP methods ────────────────────────────────────────
// All methods return the raw API response { success, data, message }
// Callers should unwrap `.data` as needed.

export const api = {
  get: <T>(path: string) => apiFetch<ApiResponse<T>>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    apiFetch<ApiResponse<T>>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      idempotencyKey,
    }),

  put: <T>(path: string, body?: unknown) =>
    apiFetch<ApiResponse<T>>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<ApiResponse<T>>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => apiFetch<ApiResponse<T>>(path, { method: "DELETE" }),
};

// ── Idempotency key generator ───────────────────────────

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}
