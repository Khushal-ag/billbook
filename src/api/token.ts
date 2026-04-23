import { AUTH_ACCESS_COOKIE_NAME, AUTH_REFRESH_COOKIE_NAME } from "@/constants/auth-cookies";

const ACCESS_TOKEN_KEY = "billbook_access_token";
const REFRESH_TOKEN_KEY = "billbook_refresh_token";

const COOKIE_ACCESS = AUTH_ACCESS_COOKIE_NAME;
const COOKIE_REFRESH = AUTH_REFRESH_COOKIE_NAME;

const COOKIE_OPTS = "path=/; SameSite=Lax";
const ACCESS_MAX_AGE = 60 * 15; // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match) return null;
  const raw = match[1];
  return raw != null ? decodeURIComponent(raw) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_OPTS}; max-age=${maxAge}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; ${COOKIE_OPTS}; max-age=0`;
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setCookie(COOKIE_ACCESS, token, ACCESS_MAX_AGE);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    clearCookie(COOKIE_ACCESS);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    token = getCookie(COOKIE_ACCESS);
    if (token) setAccessToken(token);
  }
  return token;
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    setCookie(COOKIE_REFRESH, token, REFRESH_MAX_AGE);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearCookie(COOKIE_REFRESH);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!token) {
    token = getCookie(COOKIE_REFRESH);
    if (token) setRefreshToken(token);
  }
  return token;
}
