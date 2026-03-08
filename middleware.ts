import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PAGES = new Set(["/login", "/register"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!api|admin|_next/static|_next/image|media|favicon.ico|.*\\..*).*)"],
};
