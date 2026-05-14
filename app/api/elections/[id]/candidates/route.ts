import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSessionAndElectionUnlock } from "@/lib/election-api-guard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/elections/[id]/candidates - add a candidate
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const block = await requireSessionAndElectionUnlock(req, id);
    if (block) return block;
    const body = await req.json();

    if (!body.position_id) return NextResponse.json({ error: "position_id required" }, { status: 400 });
    if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const { data, error } = await supabase
      .from("election_candidates")
      .insert({
        election_id: id,
        position_id: body.position_id,
        name: body.name,
        matric_number: body.matric_number || null,
        image_url: body.image_url || null,
        manifesto: body.manifesto || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/elections/[id]/candidates?candidate_id=...
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const block = await requireSessionAndElectionUnlock(req, id);
    if (block) return block;

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidate_id");
    if (!candidateId) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });

    const { error } = await supabase.from("election_candidates").delete().eq("id", candidateId).eq("election_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/elections/[id]/candidates - update a candidate
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const block = await requireSessionAndElectionUnlock(req, id);
    if (block) return block;

    const body = await req.json();
    const candidateId = body.candidate_id;
    if (!candidateId) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.position_id !== undefined) updates.position_id = body.position_id;
    if (body.name !== undefined) updates.name = body.name;
    if (body.matric_number !== undefined) updates.matric_number = body.matric_number || null;
    if (body.image_url !== undefined) updates.image_url = body.image_url || null;
    if (body.manifesto !== undefined) updates.manifesto = body.manifesto || null;

    const { data, error } = await supabase
      .from("election_candidates")
      .update(updates)
      .eq("id", candidateId)
      .eq("election_id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
