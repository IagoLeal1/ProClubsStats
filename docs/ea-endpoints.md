# Endpoints da EA (Pro Clubs) — investigação

> **API não oficial.** Estes endpoints são os que o próprio site da EA usa. Podem mudar sem aviso.
> Todo acesso passa por `src/lib/ea/` — se algo mudar, só essa pasta precisa de ajuste.

Investigação feita em **2026-10-05**.

## Como foi confirmado

1. A página oficial **"Clubs do EA SPORTS FC™ 27"**
   (`https://www.ea.com/games/ea-sports-fc/clubs/overview?clubId=...&platform=common-gen5`)
   declara no HTML (componente `ea-proclub-overview-fc`, atributo `endpoints`):

   ```json
   {
     "settings": "https://proclubs.ea.com/api/fc/settings",
     "clubOverallStats": "https://proclubs.ea.com/api/fc/clubs/overallStats",
     "clubInfo": "https://proclubs.ea.com/api/fc/clubs/info",
     "matches": "https://proclubs.ea.com/api/fc/clubs/matches",
     "memberStat": "https://proclubs.ea.com/api/fc/members/stats",
     "memberCareerStat": "https://proclubs.ea.com/api/fc/members/career/stats",
     "playoffAchievements": "https://proclubs.ea.com/api/fc/club/playoffAchievements"
   }
   ```

   E a página de rankings declara `allTimeLeaderboard/search` e `currentSeasonLeaderboard/search`.

2. Cada endpoint foi chamado com dados reais (clube `65474`), e as respostas definiram os
   schemas Zod em `src/lib/ea/types.ts`.

## Base e acesso

- Base: `https://proclubs.ea.com/api/fc` (configurável em `EA_API_BASE_URL`)
- Protegido por **Akamai**: `curl` recebe **403**; `fetch` do Node funciona com cabeçalhos
  de navegador (`User-Agent`, `Accept`, `Referer: https://www.ea.com/`).
- Números chegam como **string** (`"27"`); o schema converte e trata vazio como `null`.

## Plataformas

| Interno     | EA (`platform`) | Status                                   |
| ----------- | --------------- | ---------------------------------------- |
| `crossplay` | `common-gen5`   | ✅ PS5 / Xbox Series / PC                |
| `switch`    | `nx`            | ✅ busca, info e partidas validados (base de clubes bem menor) |
| —           | `common-gen4`   | ❌ HTTP 400 "Invalid query parameter"    |

## Endpoints usados

| Uso no app                 | Endpoint                                              | Status |
| -------------------------- | ----------------------------------------------------- | ------ |
| Buscar clube por nome      | `GET /allTimeLeaderboard/search?platform&clubName`    | ✅     |
| Dados do clube (nome, escudo) | `GET /clubs/info?platform&clubIds`                 | ✅     |
| Estatísticas gerais + skill rating | `GET /clubs/overallStats?platform&clubIds`    | ✅     |
| Membros e estatísticas     | `GET /members/stats?platform&clubId`                  | ✅     |
| Partidas recentes          | `GET /clubs/matches?platform&clubIds&matchType&maxResultCount` | ✅ |

Não usados (ainda): `members/career/stats` (carreira do jogador em todos os clubes),
`settings` (tabela de divisões), `club/playoffAchievements`, `currentSeasonLeaderboard/search`.

`/clubs/search` (usado por ferramentas antigas) **não existe mais** — retorna 404.

### Busca (`allTimeLeaderboard/search`)

- Retorna `[]` quando não encontra.
- Só encontra clubes presentes no ranking geral, e a correspondência de nome é a da EA
  (ex.: `"real madrid"` não encontra `"REAL   MADRID"`, mas `"real"` encontra).
  Por isso o app também aceita **ID numérico do clube** (via `clubs/info`).

### Clube inexistente

- `clubs/info` → **HTTP 500** com corpo `CLUBS_ERR_INVALID_CLUB_ID` → mapeado para `not_found`.
- `clubs/overallStats` → `[]` (clube sem jogos de liga também retorna vazio).
- `members/stats` → HTTP 500 (HTML).

### Partidas (`clubs/matches`)

- `matchType`: `leagueMatch`, `playoffMatch`, `friendlyMatch` (`gameType9` etc. → 400).
- **Máximo de 10 partidas por tipo**, mesmo com `maxResultCount` maior. Por isso salvamos
  tudo no banco a cada sincronização.
- `matchId` existe e é estável → usado para deduplicar (`fingerprint = "ea:<matchId>"`).
- `timestamp` em segundos (Unix).
- `clubs["<clubId>"]`: `goals`, `goalsAgainst`, `wins`/`losses`/`ties` (1/0 em jogos
  competitivos; **sempre 0 em amistosos** → usamos o placar), `winnerByDnf`, `details.name`,
  `details.customKit.crestAssetId`.
- `players["<clubId>"]["<playerId>"]`: `playername`, `pos` (grupo: goalkeeper/defender/
  midfielder/forward), `rating`, `goals`, `assists`, `shots`, `passattempts`, `passesmade`,
  `tackleattempts`, `tacklesmade`, `redcards`, `saves`, `mom`, `secondsPlayed`,
  `match_event_aggregate_0..3` (ver abaixo).
- `aggregate["<clubId>"]`: soma das estatísticas de cada equipe.

### Contadores de eventos (`match_event_aggregate_0..3`)

- Texto `"código:quantidade,…"` por jogador e partida (ex.: `"215:21,216:5"`), em quatro
  grupos. São **totais**: não há minuto nem ordem dos lances em nenhum campo da API, então
  não dá para saber quem abriu o placar ou quem empatou.
- A EA não documenta os códigos. A tabela usada vem da pesquisa da comunidade com cerca de
  51 mil linhas de partidas do FC 27:
  [fc27-clubs-api · match-events](https://1erkandogan.github.io/fc27-clubs-api/match-events/).
  Os códigos ligados a gol marcam a técnica (pé fraco, de primeira, por cobertura, na
  trave), não o momento do jogo.
- Conferido nos nossos 10 últimos jogos de liga em 26/10/2026: `214` = gols e `11` =
  assistências batem com os campos oficiais (com raras divergências, como a própria
  documentação avisa).
- **Usados pelo site** (confirmados na tabela da comunidade), desde 26/10/2026 — as partidas
  que a EA ainda devolvia nesse dia (a partir de 18/10) também foram preenchidas:

  | Código | Significado | Coluna |
  | ------ | ----------- | ------ |
  | `6` | Interceptações | `player_match_stats.interceptions` |
  | `115` | Pré-assistências (o passe para quem deu a assistência) | `player_match_stats.second_assists` |

- Todos os códigos ficam guardados crus em `player_match_events.counts`, para decodificar mais
  depois (a EA só devolve as 10 últimas partidas de cada tipo). Leitura em
  [`src/lib/ea/events.ts`](../src/lib/ea/events.ts).

### Membros (`members/stats`)

- `members[]` com `name` (gamertag), `proName`, `proPos`, `proOverall`, `favoritePosition`,
  `gamesPlayed`, `goals`, `assists`, `ratingAve`, `passesMade`, `passSuccessRate`,
  `tacklesMade`, `tackleSuccessRate`, `shotSuccessRate`, `winRate`, `manOfTheMatch`, `redCards`.
- **Não há ID numérico do jogador** — o vínculo com as partidas é feito pelo gamertag
  (`name` = `playername`) e o ID da partida é gravado em `players.ea_player_id`.

### Escudos

O site usa `crest-base-url` + `l<crestAssetId>.png`:
`https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l<id>.png`
(testado: HTTP 200, PNG 256×256).

## Pendências / não confirmado (TODO)

| Item | Situação |
| ---- | -------- |
| Mandante/visitante | Não há campo na resposta → schema usa "adversário" em vez de home/away. |
| Cartões amarelos | Sem campo dedicado. Colunas existem e ficam `NULL`. |
| Cartões amarelos (contadores) | A tabela da comunidade indica `95` + `213`; ainda não conferido com partidas reais. |
| Demais `match_event_aggregate_*` | Guardados crus em `player_match_events`; só `6` e `115` são usados. |
| Código de posição (`proPos`) | Tabela FIFA/FC conhecida; conferidos 5=CB, 14=CM, 25=ST. Demais a validar. |
| `regionId` | Valor bruto guardado em `ea_region_id`; mapeamento para nome não confirmado. |
| `winnerByDnf` | Sempre `"0"` nas amostras; semântica exata de abandono a validar. |
| Playoffs | Endpoint aceita `playoffMatch`, mas nenhuma amostra com dados foi obtida. |
| Bloqueio de IPs de nuvem | **Confirmado (2026-10-05):** Vercel (gru1, Node 24) → 403 do Akamai com qualquer cabeçalho. GitHub Actions → 200 com Node 22/24/26 e 403 com Node 20 (impressão digital TLS). Solução: sincronizar pelo GitHub Actions. |
