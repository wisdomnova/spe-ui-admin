import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

const UNLOCK_TYP = "election-unlock";
const UNLOCK_EXPIRY = "8h";

function jwtSecret() {
  const key = process.env.JWT_KEY;
  if (!key) throw new Error("Missing JWT_KEY env variable");
  return new TextEncoder().encode(key);
}

export async function hashElectionAccessPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyElectionAccessPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export async function signElectionUnlockToken(electionId: string): Promise<string> {
  return new SignJWT({ typ: UNLOCK_TYP })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(electionId)
    .setIssuedAt()
    .setExpirationTime(UNLOCK_EXPIRY)
    .sign(jwtSecret());
}

export async function verifyElectionUnlockToken(token: string, electionId: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (payload.typ !== UNLOCK_TYP) return false;
    return payload.sub === electionId;
  } catch {
    return false;
  }
}

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

/**
 * If election has an access password set, require a valid unlock JWT in Authorization.
 * Returns a NextResponse to return early, or null if the request may proceed.
 */
export async function assertElectionUnlockedOrNoPassword(
  req: NextRequest,
  electionId: string
): Promise<NextResponse | null> {
  const { data, error } = await supabase
    .from("elections")
    .select("access_password_hash")
    .eq("id", electionId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Election not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const hash = data.access_password_hash as string | null;
  if (!hash) return null;

  const token = bearerToken(req);
  if (!token || !(await verifyElectionUnlockToken(token, electionId))) {
    return NextResponse.json(
      { error: "Election password required", code: "PASSWORD_REQUIRED", requiresPassword: true },
      { status: 403 }
    );
  }

  return null;
}

/** Strip hash from election row for JSON responses. */
export function electionRowWithoutSecret<T extends Record<string, unknown>>(row: T): Omit<T, "access_password_hash"> & {
  has_access_password: boolean;
} {
  const { access_password_hash, ...rest } = row;
  return {
    ...rest,
    has_access_password: typeof access_password_hash === "string" && access_password_hash.length > 0,
  } as Omit<T, "access_password_hash"> & { has_access_password: boolean };
}
