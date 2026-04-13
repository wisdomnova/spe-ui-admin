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
 * "/" (overview) is always accessible to any authenticated user to prevent redirect loops.
 */
function isPageAllowedForRole(pathname: string, role: string): boolean {
  if (pathname === "/") return true; // Overview is always safe - prevents redirect loops
  if (role === "admin" || role === "dev") return true;
  const allowed = ROLE_ALLOWED_PAGES[role];
  if (!allowed) return false;
  // Exact match or starts-with for nested routes (e.g. /blogs/new)
  return allowed.some(p => pathname === p || (p !== "/" && pathname.startsWith(p + "/")));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Strip trailing slash for consistent matching (except root "/")
  const path = pathname !== "/" && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  // Static assets & Next.js internals - skip
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public pages - allow without auth (login, dev dashboard)
  if (path === "/login" || path === "/dev") {
    return NextResponse.next();
  }

  // Public API endpoints - allow without auth
  if (path === "/api/auth/login" || path === "/api/auth/dev-login") {
    return NextResponse.next();
  }

  // API routes - no redirects, just 401 if no session
  if (path.startsWith("/api/")) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = NextResponse.next();
    res.headers.set("x-user-id", session.sub);
    res.headers.set("x-user-email", session.email);
    res.headers.set("x-user-role", session.role);
    return res;
  }

  // Page routes: verify session cookie
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Dev dashboard restricted to dev role
  if (path.startsWith("/dev") && session.role !== "dev" && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Role-based page access (skip for "/" which is always allowed)
  if (path !== "/" && !path.startsWith("/dev")) {
    if (!isPageAllowedForRole(path, session.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Attach user info to headers for downstream use
  const res = NextResponse.next();
  res.headers.set("x-user-id", session.sub);
  res.headers.set("x-user-email", session.email);
  res.headers.set("x-user-role", session.role);

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
