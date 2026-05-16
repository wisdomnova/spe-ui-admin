import { NextRequest, NextResponse } from "next/server";
import { requireSessionAndElectionUnlock } from "@/lib/election-api-guard";
import {
  fetchAllElectionAssignmentsTurnout,
  fetchAllElectionVotes,
} from "@/lib/postgrest-election-pagination";
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
 * Vote rows and assignments are fetched with pagination (PostgREST default row cap ~1000).
 * PDF export and UI use this payload only — totals match the full ballot set.
 *
 * Turnout "voted" = ballots implied by anonymous vote rows (min count across races),
 * aligned with per-position charts and public Final Turnout (get_election_list_counts).
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const block = await requireSessionAndElectionUnlock(req, id);
    if (block) return block;

    const [electionRes, positionsRes, candidatesRes, assignmentsBundle, votesBundle] = await Promise.all([
      supabase.from("elections").select("id, title, status, election_date, start_time, end_time").eq("id", id).single(),
      supabase.from("election_positions").select("id, title, sort_order").eq("election_id", id).order("sort_order"),
      supabase.from("election_candidates").select("id, position_id, name, image_url").eq("election_id", id),
      fetchAllElectionAssignmentsTurnout(id),
      fetchAllElectionVotes(id),
    ]);

    if (electionRes.error) return NextResponse.json({ error: electionRes.error.message }, { status: 404 });
    if (votesBundle.error) {
      return NextResponse.json({ error: votesBundle.error.message }, { status: 500 });
    }
    if (assignmentsBundle.error) {
      return NextResponse.json({ error: assignmentsBundle.error.message }, { status: 500 });
    }

    const positions = positionsRes.data || [];
    const candidates = candidatesRes.data || [];
    const votes = votesBundle.rows;
    const assignments = assignmentsBundle.rows;

    const totalVoters = assignments.length;

    // Build per-position results first — turnout uses same ledger as charts.
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
          name: "Void",
          image_url: null,
          votes: noneOfAboveVotes,
          percentage: totalPosVotes > 0 ? Math.round((noneOfAboveVotes / totalPosVotes) * 100) : 0,
        });
      }

      candidateResults.sort((a, b) => b.votes - a.votes);

      const leader = candidateResults.length > 0 && candidateResults[0].votes > 0 ? candidateResults[0] : null;
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

    const positionTotals = positionResults.map((p) => p.total_votes);
    const voteTallyMin = positionTotals.length === 0 ? 0 : Math.min(...positionTotals);
    const voteTallyMax = positionTotals.length === 0 ? 0 : Math.max(...positionTotals);

    const ballotsFromLedger = voteTallyMin;
    const votedCount = ballotsFromLedger;
    const notVotedCount = Math.max(0, totalVoters - votedCount);
    const turnoutPercent = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0;

    const timeline: Record<string, number> = {};
    for (const vote of votes) {
      const hour = new Date(vote.created_at).toISOString().slice(0, 13) + ":00";
      timeline[hour] = (timeline[hour] || 0) + 1;
    }
    const timelineArray = Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, count }));

    const payload = {
      election: electionRes.data,
      turnout: {
        total_voters: totalVoters,
        voted: votedCount,
        not_voted: notVotedCount,
        percentage: turnoutPercent,
        vote_tally_min: voteTallyMin,
        vote_tally_max: voteTallyMax,
      },
      positions: positionResults,
      timeline: timelineArray,
      total_votes: votes.length,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
