-- Esquemas com variação ("4-3-3 (ofensivo)") e personalizados
-- ("3-4-2-1 personalizado"): o nome deixa de seguir só o padrão "4-3-3".
-- Posição e coordenadas de cada vaga já eram livres em formation_players.
alter table public.formations drop constraint if exists formations_formation_type_check;
alter table public.formations
  add constraint formations_formation_type_check check (char_length(formation_type) between 1 and 40);
