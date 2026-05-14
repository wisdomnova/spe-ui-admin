import { supabase } from "@/lib/supabase";
import { electionRowWithoutSecret } from "@/lib/election-access";

export async function fetchElectionDetailForAdmin(id: string): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string }
> {
  const [electionRes, positionsRes, candidatesRes, votersRes] = await Promise.all([
    supabase.from("elections").select("*").eq("id", id).single(),
    supabase.from("election_positions").select("*").eq("election_id", id).order("sort_order"),
    supabase.from("election_candidates").select("*").eq("election_id", id).order("created_at"),
    supabase
      .from("election_voter_assignments")
      .select("id, election_id, voter_id, has_voted, created_at, voters(id, name, matric_number, email, level, department)")
      .eq("election_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (electionRes.error) {
    return { ok: false, status: 404, error: electionRes.error.message };
  }

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

  const safeElection = electionRowWithoutSecret(electionRes.data as Record<string, unknown>);

  return {
    ok: true,
    data: {
      ...safeElection,
      positions: positionsRes.data || [],
      candidates: candidatesRes.data || [],
      voters,
    },
  };
}
