-- Atualiza um banco criado com a versão inicial do schema.sql para o montador
-- de formação. (Bancos novos: basta rodar supabase/schema.sql.)

alter table public.formation_players alter column player_id drop not null;
alter table public.formation_players add column if not exists slot_index smallint not null default 0;
alter table public.formation_players add column if not exists archetype text;
alter table public.formation_players add column if not exists strengths text[] not null default '{}';
alter table public.formation_players add column if not exists notes text;

alter table public.formation_players drop constraint if exists formation_players_slot_index_check;
alter table public.formation_players add constraint formation_players_slot_index_check check (slot_index between 0 and 10);
alter table public.formation_players drop constraint if exists formation_players_notes_check;
alter table public.formation_players add constraint formation_players_notes_check check (char_length(notes) <= 280);
alter table public.formation_players drop constraint if exists formation_players_strengths_check;
alter table public.formation_players add constraint formation_players_strengths_check check (cardinality(strengths) <= 10);

alter table public.formation_players drop constraint if exists formation_players_formation_id_slot_index_key;
alter table public.formation_players add constraint formation_players_formation_id_slot_index_key unique (formation_id, slot_index);

alter table public.formations drop constraint if exists formations_name_check;
alter table public.formations add constraint formations_name_check check (char_length(name) between 1 and 60);

-- Se um jogador for removido, a vaga continua (vira IA) em vez de sumir.
alter table public.formation_players drop constraint if exists formation_players_player_id_fkey;
alter table public.formation_players
  add constraint formation_players_player_id_fkey
  foreign key (player_id) references public.players (id) on delete set null;

-- Permite trocar dois jogadores de vaga num único upsert: a unicidade
-- (formação, jogador) só é verificada no fim da transação.
alter table public.formation_players drop constraint if exists formation_players_formation_id_player_id_key;
alter table public.formation_players
  add constraint formation_players_formation_id_player_id_key
  unique (formation_id, player_id) deferrable initially deferred;
