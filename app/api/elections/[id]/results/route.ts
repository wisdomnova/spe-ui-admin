import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/elections/[id]/results
 *
 * Returns anonymous election results:
 * - Per-position breakdown with candidate vote counts
 * - Overall turnout stats
 * - Timeline of voting activity (hourly buckets)
 *
 * NO voter identity is ever exposed.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;

    // Fetch election + positions + candidates + votes + turnout in parallel
    const [electionRes, positionsRes, candidatesRes, votesRes, assignmentsRes] = await Promise.all([
      supabase.from("elections").select("id, title, status, election_date, start_time, end_time").eq("id", id).single(),
      supabase.from("election_positions").select("id, title, sort_order").eq("election_id", id).order("sort_order"),
      supabase.from("election_candidates").select("id, position_id, name, image_url").eq("election_id", id),
      supabase.from("election_votes").select("id, position_id, candidate_id, created_at").eq("election_id", id),
      supabase
        .from("election_voter_assignments")
        .select("id, has_voted")
        .eq("election_id", id),
    ]);

    if (electionRes.error) return NextResponse.json({ error: electionRes.error.message }, { status: 404 });

    const positions = positionsRes.data || [];
    const candidates = candidatesRes.data || [];
    const votes = votesRes.data || [];
    const assignments = assignmentsRes.data || [];

    const totalVoters = assignments.length;
    const votedCount = assignments.filter((a: { has_voted: boolean }) => a.has_voted).length;
    const turnoutPercent = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

    // Build per-position results
    const positionResults = positions.map((pos) => {
      const posCandidates = candidates.filter((c) => c.position_id === pos.id);
      const posVotes = votes.filter((v) => v.position_id === pos.id);
      const totalPosVotes = posVotes.length;
      const noneOfAboveVotes = posVotes.filter((v) => !v.candidate_id).length;

      const candidateResults = posCandidates
        .map((c) => {
          const count = posVotes.filter((v) => v.candidate_id === c.id).length;
          return {
            id: c.id,
            name: c.name,
            image_url: c.image_url,
            votes: count,
            percentage: totalPosVotes > 0 ? Math.round((count / totalPosVotes) * 100) : 0,
          };
        })
        .sort((a, b) => b.votes - a.votes);

      if (noneOfAboveVotes > 0 || totalPosVotes === 0) {
        candidateResults.push({
          id: "none_of_above",
          name: "None of the above",
          image_url: null,
          votes: noneOfAboveVotes,
          percentage: totalPosVotes > 0 ? Math.round((noneOfAboveVotes / totalPosVotes) * 100) : 0,
        });
      }

      candidateResults.sort((a, b) => b.votes - a.votes);

      const leader = candidateResults.length > 0 && candidateResults[0].votes > 0 ? candidateResults[0] : null;
      // Check if there's a tie for the lead
      const isTied = leader && candidateResults.filter((c) => c.votes === leader.votes).length > 1;

      return {
        id: pos.id,
        title: pos.title,
        sort_order: pos.sort_order,
        total_votes: totalPosVotes,
        candidates: candidateResults,
        leader: isTied ? null : leader,
        is_tied: !!isTied,
      };
    });

    // Build voting timeline (hourly buckets)
    const timeline: Record<string, number> = {};
    for (const vote of votes) {
      const hour = new Date(vote.created_at).toISOString().slice(0, 13) + ":00"; // "2026-04-12T14:00"
      timeline[hour] = (timeline[hour] || 0) + 1;
    }
    const timelineArray = Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, count }));

    return NextResponse.json({
      election: electionRes.data,
      turnout: {
        total_voters: totalVoters,
        voted: votedCount,
        not_voted: totalVoters - votedCount,
        percentage: turnoutPercent,
      },
      positions: positionResults,
      timeline: timelineArray,
      total_votes: votes.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
