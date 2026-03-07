import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PAGES = new Set(["/login", "/register"]);
const PUBLIC_PATH_PREFIXES = ["/api", "/admin", "/_next", "/media"];
const PUBLIC_FILES = ["/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPrefix = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPublicFile = PUBLIC_FILES.includes(pathname);

  if (isPublicPrefix || isPublicFile) {
    return NextResponse.next();
  }

  const token = request.cookies.get("payload-token")?.value;
  const isAuthenticated = Boolean(token);
  const isAuthPage = AUTH_PAGES.has(pathname);

  if (!isAuthenticated && !isAuthPage) {
    const loginURL = new URL("/login", request.url);
    loginURL.searchParams.set("next", pathname);
    return NextResponse.redirect(loginURL);
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

