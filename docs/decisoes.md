# Decisões do projeto

O que já foi decidido no FC Clubs Stats e por quê: regras de negócio, contas que o site
faz, limites da EA e o jeito de trabalhar no repositório. O visual está em
[`design-system.md`](design-system.md); os detalhes da API da EA, em
[`ea-endpoints.md`](ea-endpoints.md). Atualize este arquivo quando uma decisão mudar.

## O produto

- Site de estatísticas do **EA SPORTS FC 27 Pro Clubs** para um grupo de amigos. Nasceu para
  o **Clube Prognum** (ID EA `1045154`, crossplay), mas nada no código é preso a um clube:
  qualquer clube entra pelo ID numérico da EA ("Adicionar clube").
- Interface toda em **português do Brasil**, informal ("Mandar no grupo", "Bagre do mês").
- Produção: https://pro-clubs-stats-two.vercel.app (atenção: `pro-clubs-stats.vercel.app` é de
  outra pessoa). Visão geral da arquitetura em `/arquitetura`, com os textos em
  `src/components/architecture/content.ts`.

## Regra de ouro: não inventar dado

Se um campo da EA não está confirmado, **não usar**. Quando o site mostra um número derivado,
a regra da conta aparece na tela. Exemplos do que isso já decidiu:

- A EA não informa lance a lance (sem minuto nem ordem dos gols). Conexões de gol só contam
  as assistências que os números da partida garantem.
- A EA informa só o **setor** (gol, defesa, meio, ataque), não a posição exata. Time da semana
  e rendimento por posição trabalham por setor. O `archetypeid` da partida não é mapeado.
- Finalizações, passes e desarmes da equipe somam só os jogadores humanos; gols do time usam o
  placar (que pode ter gol da IA).
- Os contadores `match_event_aggregate_*` só viram estatística quando o código está confirmado
  na tabela da comunidade e conferido com nossos jogos (ver `ea-endpoints.md`).

## Infraestrutura

- **Vercel** (região gru1, São Paulo) serve o site. **Supabase** Postgres 17 (sa-east-1, São
  Paulo; ref `frfniiibwskvgfaxojqh`) guarda tudo. Só mexer nesse projeto Supabase.
- A EA (Akamai) bloqueia boa parte das conexões vindas da Vercel. Por isso quem busca na EA é
  o **GitHub Actions** (`.github/workflows/sync-clubs.yml`, Node 24; Node 20 é bloqueado).
  O site tenta a EA primeiro e, se levar 403, pede uma execução ao Actions
  (`workflow_dispatch`, com `GITHUB_DISPATCH_TOKEN`).
- A EA só devolve as **10 últimas partidas de cada tipo**: tudo é salvo a cada sincronização e
  nunca apagado. Se passarem mais de 10 jogos de liga sem sincronizar, partidas se perdem (já
  aconteceu 1 vez, entre 28/10 e 02/11/2026).
- O agendamento `*/15` do GitHub atrasa muito na prática (média de ~5 h em novembro/2026).
  Proposta em aberto: disparar o robô a cada 15 min pelo Supabase (pg_cron + pg_net), com o
  token guardado no cofre do Supabase.
- `GITHUB_DISPATCH_TOKEN` é um token fine-grained (só este repositório, Actions: read and
  write). Ele expira: quando o botão "Atualizar" disser que o acesso ao GitHub expirou, gerar
  outro, trocar na Vercel e fazer redeploy.
- **Segredos** (chave secreta do Supabase, tokens) ficam só no `.env.local`, na Vercel e nos
  secrets do GitHub, colocados pelo dono. Nunca pedir, colar ou commitar esses valores.

## Como as contas funcionam

- **Noite (sessão)**: partidas com menos de 3 h entre si. MVP da noite, destaques (Artilheiro,
  Garçom, Armador, Muralha, Ladrão de bola, Pé calibrado, Maestro, Nota mais baixa) e
  "Decisivo da noite".
- **Semana**: segunda a domingo no horário de Brasília (time da semana). **Mês**: prêmios do
  mês (Bola de Ouro, Decisivo, Artilheiro, Garçom, Armador, Muralha, Ladrão de bola, Bagre).
- **O cara decisivo** (crédito dividido): em cada jogo, os gols renderam os pontos conquistados
  menos os que o time teria sem marcar; esse valor é dividido igualmente entre os gols, e quem
  marca e quem dá a assistência levam a parte do gol. No 2×1 cada gol vale 1,5; no 2×0, 1;
  no 8×1, 0,375; em derrota, 0. Pré-assistências e interceptações **não** entram nessa conta.
  Abandonos (vitória por W.O.) ficam de fora.
- **Duelo x1** (`/clubs/[id]/players/[a]/vs/[b]`): gols, assistências, pré-assistências,
  passes certos, passes errados (menos é melhor), conversão e desarmes. Três abas: jogando
  juntos (só jogos com os dois em campo, a padrão), todos os jogos (totais) e por jogo
  (médias). Cada estatística vencida vale 1 no placar; empate não conta.
- **Rei do x1** (`/clubs/[id]/players/x1`): todos contra todos no elenco atual, com o duelo
  "jogando juntos" e mínimo de 5 jogos juntos. 3 pontos por vitória, 1 por empate; desempate
  pelo saldo de estatísticas vencidas.
- **Pré-assistências** (código 115), **interceptações** (6) e **tipos de gol** (pé fraco 131,
  de primeira 128, na trave 136, cobertura 123 parcial) existem a partir das partidas de
  18/10/2026. Tipos de gol nunca passam dos gols oficiais da partida. Partidas antigas mostram
  "—".
- **Divisão**: a atual vem do ranking da temporada (`currentSeasonLeaderboard/search`); melhor
  divisão, acessos e quedas vêm de `clubs/overallStats`. O ranking de todas as temporadas fica
  parado no fim da anterior e não serve para a divisão atual. São 10 divisões (1 é a de cima).
- **Estatísticas são calculadas ao abrir a página** a partir das partidas salvas; o banco guarda
  só o que a EA informou e as formações. Assim uma fórmula nova vale para todo o histórico.
  Quando o histórico crescer muito, guardar as páginas em cache até a próxima sincronização.

## Ideias descartadas (não propor de novo)

Fregueses/carrascos contra adversários, notificações no Discord, PWA/app, conquistas e
medalhas, código do clube para proteger edições e página dos clubes de elite (a EA não
informa a formação nem a tática exata deles).

## Ideias em aberto

- "Pé fraco do mês" e outros prêmios com os tipos de gol.
- Lado defensivo do decisivo (desarmes e interceptações em jogos apertados), quando houver
  mais semanas de dados.
- Cartões amarelos (códigos 95 + 213), depois de conferir com partidas reais.
- Barra de pontos para subir de divisão (o campo `points` do ranking da temporada ainda não
  está confirmado).

## Jeito de trabalhar no repositório

- Next.js 16 (App Router) com mudanças em relação a versões antigas: ler o guia em
  `node_modules/next/dist/docs/` antes de usar uma API (ver `AGENTS.md`).
- Antes de commitar: `npm run check` (lint + tipos) e `npx next build`. Conferir telas novas
  no computador (1280 px) e no celular (390 px), sem rolagem horizontal.
- Mudança no banco: arquivo novo em `supabase/migrations/`, espelhado em `supabase/schema.sql`
  e em `src/types/database.ts`.
- Commits em português, terminando com `Co-Authored-By: Claude …`. Push direto no `main`
  (a Vercel publica sozinha).
- Para rodar a sincronização local de um clube:
  `CLUB_ID=1045154 PLATFORM=crossplay npx tsx --env-file=.env.local --conditions=react-server scripts/sync-clubs.ts`.
