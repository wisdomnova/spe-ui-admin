import { supabase } from "@/lib/supabase";

/**
 * Ballots implied by anonymous rows in election_votes (min count across configured positions).
 * Matches public/results semantics when assignment flags lag the ledger.
 */
export async function ledgerBallotCountForElection(electionId: string): Promise<number> {
  const { data: posRows, error: posErr } = await supabase
    .from("election_positions")
    .select("id")
    .eq("election_id", electionId);
  if (posErr) throw posErr;
  if (!posRows?.length) return 0;
  const counts = await Promise.all(
    posRows.map(async (p: { id: string }) => {
      const { count, error } = await supabase
        .from("election_votes")
        .select("*", { count: "exact", head: true })
        .eq("election_id", electionId)
        .eq("position_id", p.id);
      if (error) throw error;
      return count ?? 0;
    }),
  );
  return Math.min(...counts);
}
