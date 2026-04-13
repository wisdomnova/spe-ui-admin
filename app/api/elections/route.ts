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
          supabase.from("election_voter_assignments").select("id", { count: "exact", head: true }).eq("election_id", election.id),
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

    // Validate date/time fields if provided
    if (body.election_date || body.start_time || body.end_time) {
      const v = validateElectionTimes(body.election_date, body.start_time, body.end_time);
      if (v) return NextResponse.json({ error: v }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("elections")
      .insert({
        title: body.title,
        description: body.description || null,
        status: body.status || "Draft",
        election_date: body.election_date || null,
        start_time: body.start_time || null,
        end_time: body.end_time || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ── Helper: validate election date/time fields ── */
function validateElectionTimes(
  date?: string | null,
  startTime?: string | null,
  endTime?: string | null,
): string | null {
  // All three must be provided together
  if (!date || !startTime || !endTime) {
    return "Election date, start time, and end time must all be provided together.";
  }

  // Check date is not in the past
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return "Election date cannot be in the past.";
  }

  // Check times are not equal
  if (startTime === endTime) {
    return "Start time and end time cannot be the same.";
  }

  // Check end time is after start time
  if (endTime <= startTime) {
    return "End time must be after start time.";
  }

  // If date is today, start time must not have already passed
  if (date === today) {
    const now = new Date();
    const nowTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (startTime < nowTime) {
      return "Start time has already passed for today. Choose a future time or later date.";
    }
  }

  return null;
}
