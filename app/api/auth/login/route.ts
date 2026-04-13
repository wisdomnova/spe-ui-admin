import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signJWT, setSessionCookie, SessionPayload } from "@/lib/auth";

/**
 * POST /api/auth/login
 * Staff login - checks email + password_hash in admin_users table.
 * Sets httpOnly JWT cookie on success.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Look up user by email
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signJWT({
      sub: user.id,
      email: user.email,
      role: user.role as SessionPayload["role"],
    });

    // Set cookie and return
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
