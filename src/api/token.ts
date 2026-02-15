// ── Token management ────────────────────────────────────

let accessToken: string | null = null;
let refreshToken: string | null = null;

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
