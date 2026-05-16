-- Align public "Final Turnout" with anonymous ballot storage:
-- voted_count = MIN(count of election_votes per configured position), same as Results charts.
-- Apply via Supabase SQL Editor or: supabase db query --linked -f migrations/election_list_counts_rpc.sql

create or replace function public.get_election_list_counts()
returns table (
  election_id uuid,
  positions_count bigint,
  candidates_count bigint,
  voters_count bigint,
  voted_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with pos as (
    select ep.election_id, count(*)::bigint as cnt
    from election_positions ep
    group by ep.election_id
  ),
  cand as (
    select ec.election_id, count(*)::bigint as cnt
    from election_candidates ec
    group by ec.election_id
  ),
  voters as (
    select ev.election_id, count(*)::bigint as cnt
    from election_voter_assignments ev
    group by ev.election_id
  ),
  votes_per_position as (
    select
      ep.election_id,
      ep.id as position_id,
      count(ev.id)::bigint as cnt
    from election_positions ep
    left join election_votes ev
      on ev.election_id = ep.election_id
     and ev.position_id = ep.id
    group by ep.election_id, ep.id
  ),
  ballots_from_ledger as (
    select election_id, min(cnt)::bigint as ballot_count
    from votes_per_position
    group by election_id
  )
  select
    e.id as election_id,
    coalesce(pos.cnt, 0)::bigint as positions_count,
    coalesce(cand.cnt, 0)::bigint as candidates_count,
    coalesce(voters.cnt, 0)::bigint as voters_count,
    coalesce(b.ballot_count, 0)::bigint as voted_count
  from elections e
  left join pos on pos.election_id = e.id
  left join cand on cand.election_id = e.id
  left join voters on voters.election_id = e.id
  left join ballots_from_ledger b on b.election_id = e.id;
$$;

comment on function public.get_election_list_counts() is
  'Election listing counts. voted_count = ballots implied by election_votes (min rows per configured position), aligned with anonymous results UI.';

grant execute on function public.get_election_list_counts() to service_role;
