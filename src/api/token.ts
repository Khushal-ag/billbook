// ── Token management: localStorage + API cookies (token, refreshToken) ────────

const ACCESS_TOKEN_KEY = "billbook_access_token";
const REFRESH_TOKEN_KEY = "billbook_refresh_token";

/** Cookie names the API expects (GET /auth/me, POST /auth/refresh-token) */
const COOKIE_ACCESS = "token";
const COOKIE_REFRESH = "refreshToken";

const COOKIE_OPTS = "path=/; SameSite=Lax";
const ACCESS_MAX_AGE = 60 * 15; // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
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
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setCookie(COOKIE_ACCESS, token, ACCESS_MAX_AGE);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    clearCookie(COOKIE_ACCESS);
  }
}

export function getAccessToken(): string | null {
  let token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    token = getCookie(COOKIE_ACCESS);
    if (token) setAccessToken(token);
  }
  return token;
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    setCookie(COOKIE_REFRESH, token, REFRESH_MAX_AGE);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearCookie(COOKIE_REFRESH);
  }
}

export function getRefreshToken(): string | null {
  let token = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!token) {
    token = getCookie(COOKIE_REFRESH);
    if (token) setRefreshToken(token);
  }
  return token;
}
