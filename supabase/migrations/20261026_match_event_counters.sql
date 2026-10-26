-- Contadores de eventos de cada jogador por partida (match_event_aggregate_0..3 da EA).
-- A EA não documenta os códigos: usamos a tabela da comunidade (ver docs/ea-endpoints.md)
-- e só os códigos confirmados viram coluna (interceptions já existia e passa a ser
-- preenchida). O resto fica guardado cru, porque a EA só devolve as 10 últimas
-- partidas de cada tipo e não dá para buscar de novo depois.

alter table public.player_match_stats
  add column if not exists second_assists smallint check (second_assists >= 0);

create table if not exists public.player_match_events (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid        not null references public.matches (id) on delete cascade,
  player_id   uuid        not null references public.players (id) on delete cascade,
  counts      jsonb       not null,  -- {"código": quantidade}
  created_at  timestamptz not null default now(),
  constraint player_match_events_match_id_player_id_key unique (match_id, player_id)
);

create index if not exists player_match_events_player_id_idx on public.player_match_events (player_id);

alter table public.player_match_events enable row level security;
grant select on public.player_match_events to anon, authenticated;
grant all on public.player_match_events to service_role;
drop policy if exists "Public read access" on public.player_match_events;
create policy "Public read access" on public.player_match_events for select to anon, authenticated using (true);
