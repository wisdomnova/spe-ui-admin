import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/elections - list all elections with summary counts
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("elections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch counts for each election
    const enriched = await Promise.all(
      (data || []).map(async (election) => {
        const [positions, candidates, voters] = await Promise.all([
          supabase.from("election_positions").select("id", { count: "exact", head: true }).eq("election_id", election.id),
          supabase.from("election_candidates").select("id", { count: "exact", head: true }).eq("election_id", election.id),
          supabase.from("election_voters").select("id", { count: "exact", head: true }).eq("election_id", election.id),
        ]);
        return {
          ...election,
          positions_count: positions.count || 0,
          candidates_count: candidates.count || 0,
          voters_count: voters.count || 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/elections - create a new election
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const { data, error } = await supabase
      .from("elections")
      .insert({
        title: body.title,
        description: body.description || null,
        status: body.status || "Draft",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
