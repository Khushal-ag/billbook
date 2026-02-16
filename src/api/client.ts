import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types/api";
import { env } from "@/lib/env";
import { getAccessToken, setAccessToken, getRefreshToken, setRefreshToken } from "./token";
import { ApiClientError } from "./error";

// ── Axios instance ──────────────────────────────────────

const axiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/** Plain instance for refresh calls — skips the response interceptor to avoid loops */
const plainAxios = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ─────────────────────────────────

let refreshPromise: Promise<string> | null = null;

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor (auto-refresh on 401) ──────────

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; details?: unknown }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && getAccessToken() && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        // Refresh failed — clear tokens so the app redirects to login
        setAccessToken(null);
        setRefreshToken(null);
        throw new ApiClientError("Session expired. Please log in again.", 401);
      }
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

// ── Token refresh (uses plainAxios to avoid interceptor loop) ──

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) throw new Error("No refresh token");

  refreshPromise = plainAxios
    .post<ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }>>(
      "/auth/refresh-token",
      { refreshToken: currentRefreshToken },
    )
    .then((res) => {
      const { accessToken, refreshToken } = res.data.data.tokens;
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      return accessToken;
    })
    .catch((err) => {
      setAccessToken(null);
      setRefreshToken(null);
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// ── HTTP helpers ────────────────────────────────────────
// All methods return the raw API response { success, data, message }.
// Callers unwrap `.data` as needed.

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
};

// ── Idempotency key generator ───────────────────────────

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}
