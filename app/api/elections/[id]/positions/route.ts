import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/elections/[id]/positions - add a position
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();

    const { data, error } = await supabase
      .from("election_positions")
      .insert({
        election_id: id,
        title: body.title,
        description: body.description || null,
        sort_order: body.sort_order ?? 0,
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
 * DELETE /api/elections/[id]/positions - delete a position (body: { position_id })
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const positionId = searchParams.get("position_id");
    if (!positionId) return NextResponse.json({ error: "position_id required" }, { status: 400 });

    const { error } = await supabase.from("election_positions").delete().eq("id", positionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
