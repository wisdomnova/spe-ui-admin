alter table public.elections
add column if not exists show_live_voter_names boolean default true;

update public.elections
set show_live_voter_names = true
where show_live_voter_names is null;

alter table public.elections
alter column show_live_voter_names set default true;

alter table public.elections
alter column show_live_voter_names set not null;
