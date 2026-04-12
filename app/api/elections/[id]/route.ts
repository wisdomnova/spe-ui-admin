import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/elections/[id] - get a single election with all related data
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;

    const [electionRes, positionsRes, candidatesRes, votersRes] = await Promise.all([
      supabase.from("elections").select("*").eq("id", id).single(),
      supabase.from("election_positions").select("*").eq("election_id", id).order("sort_order"),
      supabase.from("election_candidates").select("*").eq("election_id", id).order("created_at"),
      supabase.from("election_voters").select("*").eq("election_id", id).order("name"),
    ]);

    if (electionRes.error) return NextResponse.json({ error: electionRes.error.message }, { status: 404 });

    return NextResponse.json({
      ...electionRes.data,
      positions: positionsRes.data || [],
      candidates: candidatesRes.data || [],
      voters: votersRes.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/elections/[id] - update election details
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;

    const { data, error } = await supabase.from("elections").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/elections/[id] - delete an election (cascades to positions, candidates, voters)
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;

    const { error } = await supabase.from("elections").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
