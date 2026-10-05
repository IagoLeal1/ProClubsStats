-- =============================================================================
-- FC Clubs Stats — schema inicial (Supabase / PostgreSQL)
--
-- Como aplicar: Supabase Dashboard → SQL Editor → colar este arquivo → Run.
-- O script é idempotente: pode ser executado novamente sem erro.
--
-- Princípios:
--   * Nada é apagado na sincronização: partidas antigas permanecem mesmo que a
--     EA deixe de retorná-las (a EA só expõe as 10 últimas por tipo).
--   * Toda escrita usa upsert sobre chaves naturais (unique constraints), então
--     sincronizar duas vezes nunca duplica dados.
--   * Leitura pública (role anon) via RLS; escrita somente com service role.
-- =============================================================================

-- gen_random_uuid() é nativo do PostgreSQL 13+.
-- Extensões ficam no schema "extensions" (recomendação do Supabase).
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;  -- busca por nome (ilike) indexada

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- clubs
-- O ID de clube da EA é único por plataforma (crossplay x Switch), por isso a
-- unicidade é (ea_club_id, platform).
-- -----------------------------------------------------------------------------
create table if not exists public.clubs (
  id              uuid primary key default gen_random_uuid(),
  ea_club_id      bigint      not null,
  platform        text        not null check (platform in ('crossplay', 'switch')),
  name            text        not null,
  ea_region_id    bigint,               -- valor bruto da EA; mapeamento para nome de região ainda não confirmado
  crest_url       text,
  skill_rating    integer,
  games_played    integer     not null default 0,
  wins            integer     not null default 0,
  draws           integer     not null default 0,
  losses          integer     not null default 0,
  goals_for       integer     not null default 0,
  goals_against   integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_synced_at  timestamptz,
  constraint clubs_ea_club_id_platform_key unique (ea_club_id, platform)
);

create index if not exists clubs_name_trgm_idx on public.clubs using gin (name extensions.gin_trgm_ops);
create index if not exists clubs_last_synced_at_idx on public.clubs (last_synced_at nulls first);

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- players
-- A EA lista membros apenas pelo gamertag (sem ID). O ID numérico do jogador
-- só aparece nas partidas; ele é preenchido em ea_player_id quando conhecido.
-- Jogadores que saem do clube não são apagados: is_member = false.
-- -----------------------------------------------------------------------------
create table if not exists public.players (
  id                   uuid primary key default gen_random_uuid(),
  club_id              uuid        not null references public.clubs (id) on delete cascade,
  ea_player_id         text,
  name                 text        not null,  -- gamertag / nome da conta
  pro_name             text,                  -- nome do Pro (personagem)
  position             text,                  -- sigla derivada do código da EA (ex.: ST, CM)
  ea_position_code     smallint,              -- código bruto da EA (proPos)
  favorite_position    text check (favorite_position in ('goalkeeper', 'defender', 'midfielder', 'forward')),
  overall              smallint,
  games_played         integer     not null default 0,
  goals                integer     not null default 0,
  assists              integer     not null default 0,
  average_rating       numeric(4, 2),
  passes_made          integer     not null default 0,
  pass_success_rate    numeric(5, 2),
  tackles_made         integer     not null default 0,
  tackle_success_rate  numeric(5, 2),
  shot_success_rate    numeric(5, 2),
  win_rate             numeric(5, 2),
  man_of_the_match     integer     not null default 0,
  red_cards            integer     not null default 0,
  is_member            boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  last_synced_at       timestamptz,
  constraint players_club_id_name_key unique (club_id, name),
  constraint players_club_id_ea_player_id_key unique (club_id, ea_player_id)
);

create index if not exists players_ea_player_id_idx on public.players (ea_player_id);

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- matches
-- Cada linha é a partida do ponto de vista de um clube (club_id). Se dois
-- clubes cadastrados se enfrentarem, a mesma partida EA gera uma linha para
-- cada um — com resultado e gols próprios.
--
-- Deduplicação:
--   fingerprint = 'ea:<matchId>' quando a EA fornece o ID (caso atual);
--   fingerprint = 'fp:<sha256(clube|adversário|data|placar)>' como fallback.
-- A EA não informa mandante/visitante, por isso guardamos "adversário".
-- -----------------------------------------------------------------------------
create table if not exists public.matches (
  id                   uuid primary key default gen_random_uuid(),
  club_id              uuid        not null references public.clubs (id) on delete cascade,
  ea_match_id          text,
  fingerprint          text        not null,
  match_type           text        not null check (match_type in ('league', 'playoff', 'friendly')),
  played_at            timestamptz not null,
  opponent_ea_club_id  bigint,
  opponent_name        text        not null,
  opponent_crest_url   text,
  goals_for            smallint    not null,
  goals_against        smallint    not null,
  result               text        not null check (result in ('W', 'D', 'L')),
  decided_by_dnf       boolean     not null default false,  -- vitória por abandono (winnerByDnf)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint matches_club_id_fingerprint_key unique (club_id, fingerprint),
  constraint matches_club_id_ea_match_id_key unique (club_id, ea_match_id)
);

create index if not exists matches_club_id_played_at_idx on public.matches (club_id, played_at desc);
create index if not exists matches_ea_match_id_idx on public.matches (ea_match_id);
create index if not exists matches_played_at_idx on public.matches (played_at desc);

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- match_team_stats
-- Estatísticas agregadas por equipe em cada partida (bloco "aggregate" da EA).
-- side = 'club' (o clube dono da partida) ou 'opponent'.
-- -----------------------------------------------------------------------------
create table if not exists public.match_team_stats (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid        not null references public.matches (id) on delete cascade,
  side              text        not null check (side in ('club', 'opponent')),
  goals             smallint    not null default 0,
  shots             smallint    not null default 0,
  passes            smallint    not null default 0,
  passes_completed  smallint    not null default 0,
  tackles           smallint    not null default 0,
  tackle_attempts   smallint    not null default 0,
  saves             smallint    not null default 0,
  red_cards         smallint    not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint match_team_stats_match_id_side_key unique (match_id, side)
);

drop trigger if exists match_team_stats_set_updated_at on public.match_team_stats;
create trigger match_team_stats_set_updated_at
  before update on public.match_team_stats
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- player_match_stats
-- interceptions / yellow_cards: a resposta JSON atual da EA não expõe esses
-- valores em campos dedicados. As colunas existem e ficam NULL até que a
-- origem seja confirmada.
-- -----------------------------------------------------------------------------
create table if not exists public.player_match_stats (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid        not null references public.matches (id) on delete cascade,
  player_id         uuid        not null references public.players (id) on delete cascade,
  position          text check (position in ('goalkeeper', 'defender', 'midfielder', 'forward')),
  rating            numeric(4, 2),
  goals             smallint    not null default 0,
  assists           smallint    not null default 0,
  shots             smallint    not null default 0,
  passes            smallint    not null default 0,  -- tentativas de passe
  passes_completed  smallint    not null default 0,
  tackles           smallint    not null default 0,  -- desarmes certos
  tackle_attempts   smallint    not null default 0,
  interceptions     smallint,
  yellow_cards      smallint,
  red_cards         smallint    not null default 0,
  saves             smallint    not null default 0,
  man_of_the_match  boolean     not null default false,
  seconds_played    integer,
  created_at        timestamptz not null default now(),
  constraint player_match_stats_match_id_player_id_key unique (match_id, player_id)
);

create index if not exists player_match_stats_player_id_idx on public.player_match_stats (player_id);

-- -----------------------------------------------------------------------------
-- formations / formation_players (montador de formação)
-- Cada formação tem 11 vagas (slot_index 0–10). Vaga sem jogador = IA.
-- Cada vaga guarda arquétipo, pontos fortes (atributos) e observação.
-- x_position / y_position: porcentagem (0–100) da largura/comprimento do campo.
-- y = 0 é a linha do próprio gol, y = 100 a linha do gol adversário.
-- -----------------------------------------------------------------------------
create table if not exists public.formations (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid        not null references public.clubs (id) on delete cascade,
  name            text        not null check (char_length(name) between 1 and 60),
  formation_type  text        not null check (formation_type ~ '^[1-9](-[1-9]){2,4}$'),  -- ex.: 4-3-3, 4-2-3-1
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists formations_club_id_idx on public.formations (club_id);

drop trigger if exists formations_set_updated_at on public.formations;
create trigger formations_set_updated_at
  before update on public.formations
  for each row execute function public.set_updated_at();

create table if not exists public.formation_players (
  id            uuid primary key default gen_random_uuid(),
  formation_id  uuid          not null references public.formations (id) on delete cascade,
  player_id     uuid          references public.players (id) on delete set null,  -- null = IA
  slot_index    smallint      not null check (slot_index between 0 and 10),
  position      text          not null,
  x_position    numeric(5, 2) not null check (x_position between 0 and 100),
  y_position    numeric(5, 2) not null check (y_position between 0 and 100),
  archetype     text,                                  -- ex.: maestro, finisher
  strengths     text[]        not null default '{}' check (cardinality(strengths) <= 10),
  notes         text          check (char_length(notes) <= 280),
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now(),
  constraint formation_players_formation_id_slot_index_key unique (formation_id, slot_index),
  -- deferrable: permite trocar dois jogadores de vaga num único upsert
  constraint formation_players_formation_id_player_id_key
    unique (formation_id, player_id) deferrable initially deferred
);

create index if not exists formation_players_player_id_idx on public.formation_players (player_id);

drop trigger if exists formation_players_set_updated_at on public.formation_players;
create trigger formation_players_set_updated_at
  before update on public.formation_players
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Permissões e RLS
-- anon/authenticated: somente leitura. service_role (usada apenas no servidor
-- do Next.js) ignora RLS e é a única que escreve.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

do $$
declare
  t text;
begin
  foreach t in array array[
    'clubs', 'players', 'matches', 'match_team_stats',
    'player_match_stats', 'formations', 'formation_players'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists "Public read access" on public.%I', t);
    execute format(
      'create policy "Public read access" on public.%I for select to anon, authenticated using (true)',
      t
    );
  end loop;
end;
$$;
