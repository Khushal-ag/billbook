import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ACCESS_COOKIE_NAME, AUTH_REFRESH_COOKIE_NAME } from "@/constants/auth-cookies";

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/forgot-password"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/opengraph-image")) return true;
  return false;
}

/**
 * Early guard for app routes: if neither access nor refresh cookie is present,
 * redirect to login (matches tokens set in `src/api/token.ts`). Client-side
 * `AppShell` still enforces session for full UX.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasAccess = Boolean(request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value);
  const hasRefresh = Boolean(request.cookies.get(AUTH_REFRESH_COOKIE_NAME)?.value);
  if (hasAccess || hasRefresh) {
    return NextResponse.next();
  }

  const from = `${pathname}${request.nextUrl.search}`;
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("auth", "login");
  url.searchParams.set("from", from);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
