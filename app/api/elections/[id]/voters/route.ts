import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/elections/[id]/voters - list voters assigned to this election
 * Returns voter data joined from the global voters table + has_voted status
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;

    const { data, error } = await supabase
      .from("election_voter_assignments")
      .select("id, election_id, voter_id, has_voted, created_at, voters(id, name, matric_number, email, level, department)")
      .eq("election_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Flatten the response for easier consumption
    const voters = (data || []).map((row: Record<string, unknown>) => {
      const voter = row.voters as Record<string, unknown> | null;
      return {
        assignment_id: row.id,
        election_id: row.election_id,
        voter_id: row.voter_id,
        has_voted: row.has_voted,
        assigned_at: row.created_at,
        name: voter?.name || "",
        matric_number: voter?.matric_number || "",
        email: voter?.email || "",
        level: voter?.level || null,
        department: voter?.department || null,
      };
    });

    return NextResponse.json(voters);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/elections/[id]/voters - assign voter(s) to this election
 *
 * Body: { voter_ids: string[] }
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = await req.json();

    const voterIds: string[] = body.voter_ids || [];
    if (voterIds.length === 0) {
      return NextResponse.json({ error: "No voter IDs provided" }, { status: 400 });
    }

    const assignments = voterIds.map((voterId) => ({
      election_id: id,
      voter_id: voterId,
    }));

    const { data, error } = await supabase
      .from("election_voter_assignments")
      .upsert(assignments, { onConflict: "election_id,voter_id" })
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ assigned: data?.length || 0 }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/elections/[id]/voters - unassign voter(s) from this election
 *
 * Query params:
 *   voter_id  – single voter to unassign
 *   clear     – "true" to unassign all voters
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const voterId = searchParams.get("voter_id");
    const clearAll = searchParams.get("clear") === "true";

    if (clearAll) {
      const { error } = await supabase.from("election_voter_assignments").delete().eq("election_id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "All voters unassigned" });
    }

    if (!voterId) return NextResponse.json({ error: "voter_id or clear=true required" }, { status: 400 });

    const { error } = await supabase
      .from("election_voter_assignments")
      .delete()
      .eq("election_id", id)
      .eq("voter_id", voterId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
