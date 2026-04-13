import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

/* ──────────────────────────────────────────────────
   Route Guard Middleware
   
   Runs on every request (except static assets).
   Checks for a valid JWT in the httpOnly cookie.
   Redirects to /login if missing or expired.

   Role-based page access:
   - admin      : ALL pages
   - programs   : Overview, Media, Leaderboard, Events
   - editorial  : Overview, Media, Leaderboard, Analytics, Email Stats, Submissions, Blogs, Newsletter
   - dni        : Overview, Media, Leaderboard, Spotlight
   - overall    : Overview, Media, Leaderboard, Team
   - partnership: Overview, Media, Leaderboard, Sponsors
   - electoral  : Overview, Media, Leaderboard, Elections, Voters, Email Stats
   - dev        : /dev/* only (plus overview)
   ────────────────────────────────────────────────── */

// Pages that don't require authentication
const PUBLIC_PAGES = new Set(["/login", "/dev"]);

// API routes that don't require authentication
const PUBLIC_API = new Set(["/api/auth/login", "/api/auth/dev-login"]);

// Define which PAGE paths each role can access
// admin can access everything so it's not listed here
// All roles get: /, /media, /leaderboard
const SHARED_PAGES = ["/", "/media", "/leaderboard"];

const ROLE_ALLOWED_PAGES: Record<string, string[]> = {
  programs:    [...SHARED_PAGES, "/events"],
  editorial:   [...SHARED_PAGES, "/analytics", "/email-analytics", "/submissions", "/blogs", "/newsletter"],
  dni:         [...SHARED_PAGES, "/spotlight"],
  overall:     [...SHARED_PAGES, "/team"],
  partnership: [...SHARED_PAGES, "/sponsors"],
  electoral:   [...SHARED_PAGES, "/elections", "/voters", "/email-analytics"],
};

/**
 * Check if a given pathname is allowed for the role.
 * Admin role has unrestricted access.
 */
function isPageAllowedForRole(pathname: string, role: string): boolean {
  if (role === "admin" || role === "dev") return true;
  const allowed = ROLE_ALLOWED_PAGES[role];
  if (!allowed) return false;
  // Exact match or starts-with for nested routes (e.g. /blogs/new)
  return allowed.some(p => pathname === p || (p !== "/" && pathname.startsWith(p + "/")));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets & Next.js internals - skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public pages - allow without auth
  if (PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // Public API endpoints - allow without auth
  if (PUBLIC_API.has(pathname)) {
    return NextResponse.next();
  }

  // Everything else: verify session cookie
  const session = await getSessionFromRequest(req);

  if (!session) {
    // API routes get 401, pages get redirected
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Dev dashboard restricted to dev role
  if (pathname.startsWith("/dev/") && session.role !== "dev") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Role-based page access - only enforce on non-API page routes
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/dev")) {
    if (!isPageAllowedForRole(pathname, session.role)) {
      // Redirect to last visited page, or overview as fallback
      const lastPage = req.cookies.get("spe_last_page")?.value;
      const fallback = lastPage && lastPage !== pathname && lastPage !== "/login" ? lastPage : "/";
      return NextResponse.redirect(new URL(fallback, req.url));
    }
  }

  // Attach user info to headers for downstream use
  const res = NextResponse.next();
  res.headers.set("x-user-id", session.sub);
  res.headers.set("x-user-email", session.email);
  res.headers.set("x-user-role", session.role);

  // Track last visited page for unauthorized redirect fallback
  if (!pathname.startsWith("/api/") && pathname !== "/login") {
    res.cookies.set("spe_last_page", pathname, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
