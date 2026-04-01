import { NextRequest, NextResponse } from "next/server";
import { signJWT, setSessionCookie } from "@/lib/auth";

/**
 * POST /api/auth/dev-login
 * Dev access - checks password against DEV_PASSWORD env variable.
 * Sets httpOnly JWT cookie with role "dev" on success.
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Access key is required" },
        { status: 400 }
      );
    }

    const devPassword = process.env.DEV_PASSWORD;
    if (!devPassword) {
      return NextResponse.json(
        { error: "Dev access not configured" },
        { status: 500 }
      );
    }

    if (password !== devPassword) {
      return NextResponse.json(
        { error: "INVALID_ACCESS_KEY" },
        { status: 401 }
      );
    }

    // Sign JWT with dev role
    const token = await signJWT({
      sub: "dev",
      email: "dev@speui.local",
      role: "dev",
    });

    const res = NextResponse.json({ success: true });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
