import type { ApiResponse } from "@/types/api";
import type { AuthTokens } from "@/types/auth";
import { AUTH_EXPIRED_EVENT } from "@/constants/auth-events";
import { env } from "@/lib/env";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./token";
import { ApiClientError } from "./error";
const REFRESH_PATH = "/auth/refresh-token";

function notifyAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

let refreshPromise: Promise<string> | null = null;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  shouldRetry?: boolean;
  includeAuth?: boolean;
};

function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function clearSessionAndNotify() {
  setAccessToken(null);
  setRefreshToken(null);
  notifyAuthExpired();
}

function extractRequestIdFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const o = payload as Record<string, unknown>;
  const id = o.requestId ?? o.request_id;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  { body, headers, shouldRetry = true, includeAuth = true }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const isRefreshRequest = path.includes(REFRESH_PATH);
  const merged = { ...(headers ?? {}) };
  const existingId =
    typeof merged["X-Request-Id"] === "string"
      ? merged["X-Request-Id"].trim()
      : typeof merged["x-request-id"] === "string"
        ? merged["x-request-id"].trim()
        : "";
  const outboundRequestId = existingId || crypto.randomUUID();
  delete merged["x-request-id"];

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...merged,
    "X-Request-Id": outboundRequestId,
  };

  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    method,
    credentials: "include",
    headers: requestHeaders,
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
      delete requestHeaders["Content-Type"];
    } else {
      requestHeaders["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
  }

  let response = await fetch(toAbsoluteUrl(path), init);

  if (response.status === 429 && shouldRetry) {
    const retryAfterHeader = response.headers.get("retry-after");
    const retryMs = retryAfterHeader
      ? Math.min(Number(retryAfterHeader) * 1000 || 2000, 10000)
      : 2000;
    await new Promise((resolve) => setTimeout(resolve, retryMs));
    response = await fetch(toAbsoluteUrl(path), init);
  }

  if (response.status === 401 && !isRefreshRequest && shouldRetry && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return request<T>(method, path, { body, headers, shouldRetry: false, includeAuth: true });
    } catch {
      clearSessionAndNotify();
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }
  }

  const payload = await parseBody(response);
  const headerRequestId = response.headers.get("x-request-id")?.trim() || undefined;

  if (!response.ok) {
    const errorData = payload as { error?: string; details?: unknown } | null;
    const requestId = extractRequestIdFromPayload(payload) ?? headerRequestId ?? outboundRequestId;

    if (response.status === 401 && !isRefreshRequest) {
      clearSessionAndNotify();
    }

    const message =
      response.status === 429
        ? "Too many requests — please wait a moment and try again."
        : errorData?.error || `Request failed (${response.status})`;

    throw new ApiClientError(message, response.status, errorData?.details, requestId);
  }

  // 204 No Content or empty body (common on DELETE)
  if (payload == null || payload === "") {
    return { success: true, data: undefined as T } as ApiResponse<T>;
  }

  if (typeof payload !== "object") {
    throw new ApiClientError(
      "Unexpected API response",
      response.status,
      undefined,
      headerRequestId ?? outboundRequestId,
    );
  }

  return payload as ApiResponse<T>;
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const currentRefreshToken = getRefreshToken();

  refreshPromise = request<{ tokens: AuthTokens }>("POST", REFRESH_PATH, {
    body: currentRefreshToken ? { refreshToken: currentRefreshToken } : {},
    shouldRetry: false,
    includeAuth: false,
  })
    .then((res) => {
      const { accessToken, refreshToken } = res.data.tokens;
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      return accessToken;
    })
    .catch((err) => {
      setAccessToken(null);
      setRefreshToken(null);
      notifyAuthExpired();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function buildAuthorizedHeaders(accept: string): Record<string, string> {
  const outboundRequestId = crypto.randomUUID();
  const requestHeaders: Record<string, string> = {
    Accept: accept,
    "X-Request-Id": outboundRequestId,
  };
  const token = getAccessToken();
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  return requestHeaders;
}

/**
 * Authenticated GET that returns a binary body (e.g. CSV reports). Handles refresh on 401.
 */
async function requestBlob(
  path: string,
): Promise<{ blob: Blob; contentDisposition: string | null }> {
  const isRefreshRequest = path.includes(REFRESH_PATH);

  let response = await fetch(toAbsoluteUrl(path), {
    method: "GET",
    credentials: "include",
    headers: buildAuthorizedHeaders("text/csv, */*"),
  });

  if (response.status === 401 && !isRefreshRequest && getRefreshToken()) {
    try {
      await refreshAccessToken();
      response = await fetch(toAbsoluteUrl(path), {
        method: "GET",
        credentials: "include",
        headers: buildAuthorizedHeaders("text/csv, */*"),
      });
    } catch {
      clearSessionAndNotify();
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }
  }

  const headerRequestId = response.headers.get("x-request-id")?.trim() || undefined;

  if (!response.ok) {
    const payload = await parseBody(response);
    const errorData = payload as { error?: string } | null;
    const requestId =
      extractRequestIdFromPayload(payload) ?? headerRequestId ?? crypto.randomUUID();

    if (response.status === 401 && !isRefreshRequest) {
      clearSessionAndNotify();
    }

    throw new ApiClientError(
      errorData?.error || `Request failed (${response.status})`,
      response.status,
      undefined,
      requestId,
    );
  }

  const blob = await response.blob();
  return {
    blob,
    contentDisposition: response.headers.get("content-disposition"),
  };
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),

  getBlob: (path: string) => requestBlob(path),

  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    request<T>("POST", path, {
      body,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),

  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),

  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),

  delete: <T>(path: string, body?: unknown) =>
    request<T>("DELETE", path, body !== undefined ? { body } : {}),

  postForm: <T>(path: string, formData: FormData) => request<T>("POST", path, { body: formData }),
};

/** RFC 4122 UUID — matches Swagger `Idempotency-Key` format (uuid). */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}
