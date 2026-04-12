import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/elections/[id]/candidates - add a candidate
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
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
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidate_id");
    if (!candidateId) return NextResponse.json({ error: "candidate_id required" }, { status: 400 });

    const { error } = await supabase.from("election_candidates").delete().eq("id", candidateId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
