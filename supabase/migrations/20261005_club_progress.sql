-- Evolução do clube (skill rating e campanha ao longo do tempo).
create table if not exists public.club_progress (
  id             uuid primary key default gen_random_uuid(),
  club_id        uuid        not null references public.clubs (id) on delete cascade,
  captured_at    timestamptz not null default now(),
  skill_rating   integer,
  games_played   integer     not null,
  wins           integer     not null,
  draws          integer     not null,
  losses         integer     not null,
  goals_for      integer     not null,
  goals_against  integer     not null,
  constraint club_progress_club_id_games_played_key unique (club_id, games_played)
);

create index if not exists club_progress_club_id_captured_at_idx
  on public.club_progress (club_id, captured_at);

alter table public.club_progress enable row level security;
grant select on public.club_progress to anon, authenticated;
grant all on public.club_progress to service_role;
drop policy if exists "Public read access" on public.club_progress;
create policy "Public read access" on public.club_progress
  for select to anon, authenticated using (true);

-- Primeiro ponto: o estado atual de cada clube já salvo.
insert into public.club_progress
  (club_id, captured_at, skill_rating, games_played, wins, draws, losses, goals_for, goals_against)
select id, coalesce(last_synced_at, now()), skill_rating, games_played, wins, draws, losses, goals_for, goals_against
from public.clubs
where games_played > 0
on conflict (club_id, games_played) do nothing;
