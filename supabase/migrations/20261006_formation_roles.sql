-- Capitão e cobradores de bola parada de cada formação. Apontam para o
-- jogador (não para a vaga), então acompanham quem foi escolhido mesmo se o
-- esquema mudar; se o jogador for apagado, a função fica vazia.
alter table public.formations
  add column if not exists captain_id         uuid references public.players (id) on delete set null,
  add column if not exists penalty_taker_id   uuid references public.players (id) on delete set null,
  add column if not exists free_kick_taker_id uuid references public.players (id) on delete set null,
  add column if not exists corner_taker_id    uuid references public.players (id) on delete set null;
