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
      supabase.from("election_voter_assignments")
        .select("id, election_id, voter_id, has_voted, created_at, voters(id, name, matric_number, email, level, department)")
        .eq("election_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (electionRes.error) return NextResponse.json({ error: electionRes.error.message }, { status: 404 });

    // Flatten voter assignments
    const voters = (votersRes.data || []).map((row: Record<string, unknown>) => {
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

    return NextResponse.json({
      ...electionRes.data,
      positions: positionsRes.data || [],
      candidates: candidatesRes.data || [],
      voters,
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

    // Fetch current election to validate against
    const { data: current, error: fetchErr } = await supabase
      .from("elections")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.is_open !== undefined) updates.is_open = body.is_open;

    // Handle date/time updates
    const newDate = body.election_date !== undefined ? body.election_date : current.election_date;
    const newStart = body.start_time !== undefined ? body.start_time : current.start_time;
    const newEnd = body.end_time !== undefined ? body.end_time : current.end_time;

    if (body.election_date !== undefined) updates.election_date = body.election_date;
    if (body.start_time !== undefined) updates.start_time = body.start_time;
    if (body.end_time !== undefined) updates.end_time = body.end_time;

    // Only validate date/time if a scheduling field is actually being changed
    const isScheduleChange = body.election_date !== undefined || body.start_time !== undefined || body.end_time !== undefined;
    if (isScheduleChange && (newDate || newStart || newEnd)) {
      const v = validateElectionTimes(newDate, newStart, newEnd);
      if (v) return NextResponse.json({ error: v }, { status: 400 });
    }

    const { data, error } = await supabase.from("elections").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
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
  if (!date || !startTime || !endTime) {
    return "Election date, start time, and end time must all be provided together.";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return "Election date cannot be in the past.";
  }

  if (startTime === endTime) {
    return "Start time and end time cannot be the same.";
  }

  if (endTime <= startTime) {
    return "End time must be after start time.";
  }

  if (date === today) {
    const now = new Date();
    const nowTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (startTime < nowTime) {
      return "Start time has already passed for today. Choose a future time or later date.";
    }
  }

  return null;
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
