-- Tipos de gol, lidos dos contadores de eventos da EA (tabela da comunidade, ver
-- docs/ea-endpoints.md): 128 = de primeira, 131 = pé fraco, 136 = na trave (confirmados)
-- e 123 = cobertura (parcial: quando marca é cobertura, mas nem toda cobertura é marcada).
-- Cada tipo nunca passa dos gols oficiais da partida: em alguns jogos os contadores
-- divergem do campo de gols.

alter table public.player_match_stats
  add column if not exists goals_first_time smallint check (goals_first_time >= 0),
  add column if not exists goals_weak_foot  smallint check (goals_weak_foot >= 0),
  add column if not exists goals_chipped    smallint check (goals_chipped >= 0),
  add column if not exists goals_off_post   smallint check (goals_off_post >= 0);

-- Preenche as partidas que já têm os contadores crus guardados.
update public.player_match_stats s set
  goals_first_time = least(coalesce((e.counts ->> '128')::int, 0), s.goals),
  goals_weak_foot  = least(coalesce((e.counts ->> '131')::int, 0), s.goals),
  goals_chipped    = least(coalesce((e.counts ->> '123')::int, 0), s.goals),
  goals_off_post   = least(coalesce((e.counts ->> '136')::int, 0), s.goals)
from public.player_match_events e
where e.match_id = s.match_id and e.player_id = s.player_id;
