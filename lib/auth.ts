import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────
   Custom JWT Authentication
   
   - Tokens signed with HS256 using JWT_KEY
   - Stored in httpOnly, secure, sameSite cookie
   - NO localStorage, NO client-side token access
   - XSS-safe by design
   ────────────────────────────────────────────────── */

const COOKIE_NAME = "spe_session";
const TOKEN_EXPIRY = "7d";

function getSecret() {
  const key = process.env.JWT_KEY;
  if (!key) throw new Error("Missing JWT_KEY env variable");
  return new TextEncoder().encode(key);
}

/* ── Payload shape ────────────────────────────── */

export interface SessionPayload {
  sub: string;        // user id
  email: string;
  role: "admin" | "media" | "events" | "dev";
}

/* ── JWT Operations ───────────────────────────── */

export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}

/* ── Cookie Operations ────────────────────────── */

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}

/* ── Session Helpers ──────────────────────────── */

/**
 * Read session from cookie in API routes / server components.
 * Uses next/headers cookies() - works in App Router server context.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

/**
 * Read session from a NextRequest (for middleware).
 * Does NOT use next/headers - uses the request cookie directly.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

/**
 * Guard for API routes. Returns session or throws 401 response.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}
