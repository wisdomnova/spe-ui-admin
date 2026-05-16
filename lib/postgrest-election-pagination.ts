import { supabase } from "@/lib/supabase";

/**
 * PostgREST / Supabase REST returns at most this many rows per request unless configured otherwise.
 * Paginate every election aggregate that can exceed it (votes = voters × positions; assignments = voters).
 */
export const POSTGREST_PAGE_SIZE = 1000;

export type ElectionVoteRow = {
  id: string;
  position_id: string;
  candidate_id: string | null;
  created_at: string;
};

export async function fetchAllElectionVotes(electionId: string): Promise<{ rows: ElectionVoteRow[]; error: Error | null }> {
  const rows: ElectionVoteRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("election_votes")
      .select("id, position_id, candidate_id, created_at")
      .eq("election_id", electionId)
      .order("id", { ascending: true })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error) return { rows: [], error: new Error(error.message) };
    const batch = (data ?? []) as ElectionVoteRow[];
    rows.push(...batch);
    if (batch.length < POSTGREST_PAGE_SIZE) break;
    from += POSTGREST_PAGE_SIZE;
  }
  return { rows, error: null };
}

export type AssignmentTurnoutRow = { id: string; has_voted: boolean };

export async function fetchAllElectionAssignmentsTurnout(electionId: string): Promise<{
  rows: AssignmentTurnoutRow[];
  error: Error | null;
}> {
  const rows: AssignmentTurnoutRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("election_voter_assignments")
      .select("id, has_voted")
      .eq("election_id", electionId)
      .order("id", { ascending: true })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error) return { rows: [], error: new Error(error.message) };
    const batch = (data ?? []) as AssignmentTurnoutRow[];
    rows.push(...batch);
    if (batch.length < POSTGREST_PAGE_SIZE) break;
    from += POSTGREST_PAGE_SIZE;
  }
  return { rows, error: null };
}

const ASSIGNMENT_WITH_VOTER_SELECT =
  "id, election_id, voter_id, has_voted, created_at, voters(id, name, matric_number, email, level, department)";

export type FlatAssignedVoter = {
  assignment_id: string;
  election_id: string;
  voter_id: string;
  has_voted: boolean;
  assigned_at: string;
  name: string;
  matric_number: string;
  email: string;
  level: string | null;
  department: string | null;
};

/** Full assignment list with embedded voter profile — paginated so counts and tabs stay accurate past 1000 voters. */
export async function fetchAllElectionAssignmentsWithVotersFlat(electionId: string): Promise<{
  voters: FlatAssignedVoter[];
  error: Error | null;
}> {
  const raw: Record<string, unknown>[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("election_voter_assignments")
      .select(ASSIGNMENT_WITH_VOTER_SELECT)
      .eq("election_id", electionId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error) return { voters: [], error: new Error(error.message) };
    const batch = data ?? [];
    raw.push(...batch);
    if (batch.length < POSTGREST_PAGE_SIZE) break;
    from += POSTGREST_PAGE_SIZE;
  }

  const voters: FlatAssignedVoter[] = raw.map((row) => {
    const voter = row.voters as Record<string, unknown> | null;
    return {
      assignment_id: String(row.id),
      election_id: String(row.election_id),
      voter_id: String(row.voter_id),
      has_voted: Boolean(row.has_voted),
      assigned_at: String(row.created_at ?? ""),
      name: voter?.name != null ? String(voter.name) : "",
      matric_number: voter?.matric_number != null ? String(voter.matric_number) : "",
      email: voter?.email != null ? String(voter.email) : "",
      level: voter?.level != null ? String(voter.level) : null,
      department: voter?.department != null ? String(voter.department) : null,
    };
  });

  return { voters, error: null };
}
