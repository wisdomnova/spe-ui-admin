import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { verifyElectionAccessPassword, signElectionUnlockToken } from "@/lib/election-access";
import { fetchElectionDetailForAdmin } from "@/lib/election-detail";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/elections/[id]/unlock
 * Body: { password: string }
 *
 * Verifies the election access password and returns a short-lived JWT plus the
 * same payload shape as GET /api/elections/[id] (without exposing the hash).
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();
    const password = typeof body?.password === "string" ? body.password : "";

    const { data: row, error } = await supabase
      .from("elections")
      .select("access_password_hash")
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }

    const hash = row.access_password_hash as string | null;
    if (!hash) {
      return NextResponse.json({ error: "This election does not require an access password" }, { status: 400 });
    }

    const ok = await verifyElectionAccessPassword(password, hash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const detail = await fetchElectionDetailForAdmin(id);
    if (!detail.ok) {
      return NextResponse.json({ error: detail.error }, { status: detail.status });
    }

    const token = await signElectionUnlockToken(id);
    return NextResponse.json({ token, election: detail.data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
