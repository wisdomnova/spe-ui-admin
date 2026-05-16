-- Lightweight counts for GET /api/elections (one round trip, index-friendly GROUP BY).
-- Run against your Supabase project (SQL editor or supabase db push).

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
  voted as (
    select ev.election_id, count(*)::bigint as cnt
    from election_voter_assignments ev
    where coalesce(ev.has_voted, false) = true
    group by ev.election_id
  )
  select
    e.id as election_id,
    coalesce(pos.cnt, 0)::bigint as positions_count,
    coalesce(cand.cnt, 0)::bigint as candidates_count,
    coalesce(voters.cnt, 0)::bigint as voters_count,
    coalesce(voted.cnt, 0)::bigint as voted_count
  from elections e
  left join pos on pos.election_id = e.id
  left join cand on cand.election_id = e.id
  left join voters on voters.election_id = e.id
  left join voted on voted.election_id = e.id;
$$;

comment on function public.get_election_list_counts() is
  'Aggregated election stats for public listing; avoids scanning full assignment/candidate tables into the API.';

grant execute on function public.get_election_list_counts() to service_role;
