-- Divisão do clube (ranking geral da EA) e evolução do OVR de cada Pro.
-- A EA só informa os valores ATUAIS: guardamos um registro por nº de jogos,
-- como já fazemos com o skill rating em club_progress.

alter table public.clubs
  add column if not exists current_division smallint check (current_division > 0),
  add column if not exists best_division    smallint check (best_division > 0),
  add column if not exists promotions       integer  check (promotions >= 0),
  add column if not exists relegations      integer  check (relegations >= 0);

alter table public.club_progress
  add column if not exists current_division smallint check (current_division > 0);

create table if not exists public.player_progress (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid        not null references public.players (id) on delete cascade,
  captured_at   timestamptz not null default now(),
  overall       smallint    not null check (overall > 0),
  games_played  integer     not null check (games_played >= 0),
  constraint player_progress_player_id_games_played_key unique (player_id, games_played)
);

create index if not exists player_progress_player_id_captured_at_idx
  on public.player_progress (player_id, captured_at);

alter table public.player_progress enable row level security;
grant select on public.player_progress to anon, authenticated;
grant all on public.player_progress to service_role;
drop policy if exists "Public read access" on public.player_progress;
create policy "Public read access" on public.player_progress for select to anon, authenticated using (true);
