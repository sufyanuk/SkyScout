import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for signed-in areas: visitors without an Auth.js session
 * cookie are sent to /login before the page renders. Pages still verify the
 * session themselves (requireUser), which is the authoritative check.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/favorites/:path*"],
};
