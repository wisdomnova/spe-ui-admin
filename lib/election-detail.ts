import { fetchAllElectionAssignmentsWithVotersFlat } from "@/lib/postgrest-election-pagination";
import { supabase } from "@/lib/supabase";
import { electionRowWithoutSecret } from "@/lib/election-access";

export async function fetchElectionDetailForAdmin(id: string): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string }
> {
  const [electionRes, positionsRes, candidatesRes, votersBundle] = await Promise.all([
    supabase.from("elections").select("*").eq("id", id).single(),
    supabase.from("election_positions").select("*").eq("election_id", id).order("sort_order"),
    supabase.from("election_candidates").select("*").eq("election_id", id).order("created_at"),
    fetchAllElectionAssignmentsWithVotersFlat(id),
  ]);

  if (electionRes.error) {
    return { ok: false, status: 404, error: electionRes.error.message };
  }

  if (votersBundle.error) {
    return { ok: false, status: 500, error: votersBundle.error.message };
  }

  const safeElection = electionRowWithoutSecret(electionRes.data as Record<string, unknown>);

  return {
    ok: true,
    data: {
      ...safeElection,
      positions: positionsRes.data || [],
      candidates: candidatesRes.data || [],
      voters: votersBundle.voters,
    },
  };
}
