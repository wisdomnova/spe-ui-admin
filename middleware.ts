import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * Minimal auth middleware.
 * Only job: redirect unauthenticated page visits to /login.
 * Everything is wrapped in try-catch to never cause a redirect loop.
 */

const ROLE_PAGES: Record<string, string[]> = {
  programs:    ["/events"],
  editorial:   ["/analytics", "/email-analytics", "/submissions", "/blogs", "/newsletter"],
  dni:         ["/spotlight"],
  overall:     ["/team"],
  partnership: ["/sponsors"],
  electoral:   ["/elections", "/voters", "/email-analytics"],
};

export async function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;

    /* ── Always skip these ── */
    if (
      path === "/login" ||
      path === "/login/" ||
      path.startsWith("/_next") ||
      path.startsWith("/api/auth/") ||
      path.includes(".")
    ) {
      return NextResponse.next();
    }

    /* ── Session check ── */
    let session;
    try {
      session = await getSessionFromRequest(req);
    } catch {
      session = null;
    }

    /* ── API routes: 401, never redirect ── */
    if (path.startsWith("/api/") || path.startsWith("/api")) {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    /* ── No session → login ── */
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    /* ── Role check (never redirect from /, /media, /leaderboard) ── */
    const role = session.role;
    if (
      role !== "admin" &&
      role !== "dev" &&
      path !== "/" &&
      path !== "/media" &&
      path !== "/leaderboard"
    ) {
      const allowed = ROLE_PAGES[role];
      const ok = allowed?.some(
        (p) => path === p || path.startsWith(p + "/")
      );
      if (!ok) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    /* If anything goes wrong, just let the request through rather than loop */
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon).*)"],
};
