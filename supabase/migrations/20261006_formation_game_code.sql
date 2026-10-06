-- Código de compartilhamento da tática gerado dentro do EA SPORTS FC (ex.:
-- "3HPspCY9Bzf"). O site só guarda e mostra; quem gera o código é o jogo.
alter table public.formations
  add column if not exists game_code text check (game_code is null or char_length(game_code) between 1 and 40);
