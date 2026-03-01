import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types/api";
import type { AuthTokens } from "@/types/auth";
import { env } from "@/lib/env";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./token";
import { ApiClientError } from "./error";

const AUTH_EXPIRED_EVENT = "auth:expired";

function notifyAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/** Refresh only: sends refreshToken cookie (no Authorization), no body. */
const refreshAxios = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; details?: unknown }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isUnauthorized = error.response?.status === 401;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh-token") ?? false;
    const hasRefreshToken = Boolean(getRefreshToken());

    if (isUnauthorized && !isRefreshRequest && !originalRequest._retry && hasRefreshToken) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        setAccessToken(null);
        setRefreshToken(null);
        notifyAuthExpired();
        throw new ApiClientError("Session expired. Please log in again.", 401);
      }
    }

    if (isUnauthorized && !isRefreshRequest) {
      setAccessToken(null);
      setRefreshToken(null);
      notifyAuthExpired();
    }

    const status = error.response?.status ?? 500;
    const data = error.response?.data;
    throw new ApiClientError(
      data?.error || error.message || `Request failed (${status})`,
      status,
      data?.details,
    );
  },
);

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshAxios
    .post<ApiResponse<{ tokens: AuthTokens }>>("/auth/refresh-token", {})
    .then((res) => {
      const { accessToken, refreshToken } = res.data.data.tokens;
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

export const api = {
  get: <T>(path: string) => axiosInstance.get<ApiResponse<T>>(path).then((r) => r.data),

  post: <T>(path: string, body?: unknown, idempotencyKey?: string) =>
    axiosInstance
      .post<ApiResponse<T>>(path, body, {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      })
      .then((r) => r.data),

  put: <T>(path: string, body?: unknown) =>
    axiosInstance.put<ApiResponse<T>>(path, body).then((r) => r.data),

  patch: <T>(path: string, body?: unknown) =>
    axiosInstance.patch<ApiResponse<T>>(path, body).then((r) => r.data),

  delete: <T>(path: string) => axiosInstance.delete<ApiResponse<T>>(path).then((r) => r.data),

  /** FormData upload; omits Content-Type so axios sets multipart boundary. */
  postForm: <T>(path: string, formData: FormData) => {
    const headers = { ...axiosInstance.defaults.headers } as Record<string, unknown>;
    delete headers["Content-Type"];
    return axiosInstance
      .post<ApiResponse<T>>(path, formData, { headers: headers as Record<string, string> })
      .then((r) => r.data);
  },
};

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}
