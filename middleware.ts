import { NextRequest, NextResponse } from "next/server";

/**
 * StoryVerse Middleware
 * Edge-safe. No Node APIs. No filesystem. No __dirname.
 *
 * Responsibilities:
 * - Protect /dashboard routes
 * - Allow public routes through
 * - Never crash Edge runtime
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public routes
  if (
    pathname.startsWith("/gift") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const accessToken = request.cookies.get("sb-access-token")?.value;

    // Not logged in → redirect to login
    if (!accessToken) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Apply middleware to everything except static assets
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
