# FC Clubs Stats

Estatísticas para clubes do **EA SPORTS FC 27 Pro Clubs** — um mini Sofascore/Tracker:
pesquise um clube e veja resumo, jogadores, rankings internos, histórico de partidas e
(em breve) formações.

O diferencial é o **histórico próprio**: a EA só expõe as 10 partidas mais recentes de cada
tipo. Cada sincronização salva as partidas novas no nosso banco, e nada é apagado — com o
tempo o clube acumula 100, 500, 1000 partidas.

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · TypeScript strict ·
Tailwind CSS 4 · shadcn/ui · Supabase (PostgreSQL) · Zod · ESLint · deploy na Vercel.

## Como rodar

Requisitos: Node.js ≥ 20.9 e um projeto no [Supabase](https://supabase.com) (o plano grátis serve).

```bash
npm install
cp .env.example .env.local   # preencha as variáveis (abaixo)
npm run dev                  # http://localhost:3000
```

### 1. Banco de dados

No painel do Supabase → **SQL Editor**, cole e rode [`supabase/schema.sql`](supabase/schema.sql).
O script é idempotente (pode rodar de novo sem erro).

### 2. Variáveis de ambiente (`.env.local`)

| Variável | Onde achar | Uso |
| -------- | ---------- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API (anon / publishable) | Leituras no servidor (RLS somente-select) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (service_role / secret) | Escrita da sincronização — **somente servidor** |
| `EA_API_BASE_URL` | opcional | Sobrescreve `https://proclubs.ea.com/api/fc` |
| `GITHUB_DISPATCH_TOKEN` | opcional (produção) | Faz o "Atualizar" pedir a sincronização ao GitHub Actions |
| `NEXT_PUBLIC_SITE_URL` | opcional | URL pública para prévias de link (na Vercel é detectada) |

A service role nunca chega ao browser: os módulos que a usam importam `server-only`, e o
build falha se algum Client Component tentar importá-los.

### Scripts

```bash
npm run dev        # desenvolvimento
npm run lint       # ESLint
npm run typecheck  # gera tipos de rota do Next + tsc --noEmit
npm run build      # build de produção
npm run sync       # sincroniza clubes com dados velhos (CLUB_ID=… para um clube)
```

## Deploy na Vercel

1. Importe o repositório na Vercel e configure as variáveis do Supabase (Production e Preview).
2. **Sincronização pelo GitHub Actions.** A EA (Akamai) bloqueia os IPs da Vercel/AWS — testado:
   HTTP 403 a partir da Vercel, HTTP 200 a partir do GitHub Actions com Node 22+ (o Node 20 é
   bloqueado pela "impressão digital" da conexão). Por isso quem conversa com a EA em produção é
   o workflow [`.github/workflows/sync-clubs.yml`](.github/workflows/sync-clubs.yml), que roda a
   cada 15 min (grátis em repositório público) e grava direto no Supabase. Configure em
   **Settings → Secrets and variables → Actions**:

   | Tipo | Nome | Valor |
   | ---- | ---- | ----- |
   | Variable | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
   | Variable | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave publicável |
   | Secret | `SUPABASE_SERVICE_ROLE_KEY` | chave secreta |

   Para adicionar um clube novo manualmente: **Actions → Sincronizar clubes → Run workflow** com
   o ID do clube na EA.
3. **Opcional — "Atualizar" na hora.** Crie um token *fine-grained* no GitHub com acesso só a
   este repositório e permissão **Actions: Read and write**, e coloque em `GITHUB_DISPATCH_TOKEN`
   na Vercel. Aí o botão "Atualizar" e a abertura de um clube com dados velhos pedem a
   sincronização ao Actions (os dados chegam em 1–2 min). Sem o token, vale o agendamento.

Localmente (rede residencial) a EA responde normalmente: o site sincroniza direto, sem Actions.

## Arquitetura

```
src/
├── app/                      # rotas (Server Components por padrão)
│   ├── page.tsx              # /            busca + clubes recentes
│   ├── search/               # /search      resultados da EA + clubes já salvos
│   ├── clubs/[clubId]/       # dashboard, players, matches, sessions, records, team-of-the-week, awards, formations
│   ├── actions/sync-club.ts  # Server Actions: abrir clube / atualizar
├── components/
│   ├── clubs/ players/ matches/ formations/ layout/
│   └── ui/                   # shadcn/ui
├── lib/
│   ├── ea/                   # ÚNICA camada que fala com a EA
│   │   ├── client.ts         # EAClient: base URL, headers, timeout, retries, parse + Zod
│   │   ├── types.ts          # schemas Zod das respostas da EA (formato externo)
│   │   ├── mappers.ts        # EA → modelos internos (ClubSnapshot, PlayerSnapshot, MatchSnapshot)
│   │   ├── clubs.ts players.ts matches.ts
│   │   └── constants.ts positions.ts errors.ts
│   ├── db/                   # Supabase: clientes + repositórios (linhas ↔ modelos internos)
│   ├── stats/                # métricas derivadas (aproveitamento, G+A, rankings, ordenação)
│   ├── env.ts errors.ts format.ts
├── services/sync/            # orquestração da sincronização (idempotente)
scripts/sync-clubs.ts         # sincronização fora da Vercel (GitHub Actions)
└── types/                    # modelos de domínio + tipos do banco
```

Separação de camadas: **EA (externo) → mappers → modelos internos → repositórios (banco) → UI**.
Componentes nunca veem o formato da EA nem linhas do banco.

### Fluxo de sincronização

```
pesquisa → resultado da EA → "Ver estatísticas" (Server Action)
  → clubs/info + overallStats      → upsert clubs        (falha aqui = erro para o usuário)
  → members/stats                  → upsert players      (ex-membros: is_member = false)
  → clubs/matches (liga/playoff/amistoso, em paralelo)
      → upsert matches por (club_id, fingerprint)        (antigas nunca são apagadas)
      → upsert match_team_stats por (match_id, side)
      → vincula jogadores (ID EA ↔ gamertag) e upsert player_match_stats por (match_id, player_id)
  → redirect para o dashboard
```

- **Idempotente**: tudo é upsert sobre unique constraints; rodar duas vezes não duplica nada.
- **Dados parciais**: falha em jogadores ou em um tipo de partida não aborta — vira aviso.
- **Proteção da EA**: o mesmo clube não é ressincronizado em menos de 2 minutos.
- **Gatilhos**: GitHub Actions a cada 15 min; botão "Atualizar"; abertura do clube com dados
  com mais de 20 min (em segundo plano). Onde a EA bloqueia o servidor (Vercel), os dois últimos
  pedem a sincronização ao GitHub Actions (`requestClubSync`).
- **Fingerprint**: `ea:<matchId>`; sem ID confiável, `fp:sha256(clube|adversário|data|placar)`.

### Banco

`clubs`, `players`, `matches`, `match_team_stats`, `player_match_stats`, `formations`,
`formation_players` — ver [`supabase/schema.sql`](supabase/schema.sql).

Decisões em relação ao modelo inicial:

- `clubs`: unicidade é `(ea_club_id, platform)` — o ID da EA é por plataforma.
- `matches`: a EA não diz quem foi mandante → em vez de `home_club_name/away_club_name`,
  guardamos `opponent_*` do ponto de vista do clube, mais `match_type`.
- `match_team_stats` (nova): estatísticas agregadas de cada equipe, usadas na comparação.
- `players`: a EA lista membros só pelo gamertag; unicidade `(club_id, name)` e
  `ea_player_id` preenchido a partir das partidas.

### Tratamento de erros

| Situação | Comportamento |
| -------- | ------------- |
| Clube não encontrado | Busca vazia com dica; `clubs/info` 500 `INVALID_CLUB_ID` → mensagem própria |
| EA indisponível / timeout / 429 | Retry com backoff (2×) e mensagem amigável |
| Resposta inválida | Validação Zod → erro `invalid_response`; partidas malformadas são ignoradas individualmente |
| Banco indisponível | `DatabaseError` → mensagem amigável; páginas mostram error boundary com "Tentar novamente" |
| Dados parciais | Sincronização continua e mostra avisos |

Stack traces ficam só no log do servidor.

## Integração com a EA

Detalhes, respostas e pendências em [`docs/ea-endpoints.md`](docs/ea-endpoints.md).

**Funcionando (validado contra a API real):** busca por nome e por ID, dados do clube, escudo,
skill rating, recorde, membros com estatísticas, partidas de liga e amistosos com estatísticas
por equipe e por jogador.

**Bloqueado:** chamadas a partir da Vercel (HTTP 403 do Akamai) — resolvido sincronizando pelo
GitHub Actions (ver Deploy).

**Pendente de validação:** partidas de playoff (sem amostra), cartões amarelos e interceptações
(sem campo), mandante/visitante (sem campo), códigos de posição além de CB/CM/ST, nome da
região, semântica de `winnerByDnf`.

## Funcionalidades

- **Dashboard**: campanha, aproveitamento, últimos jogos, atalho para a última noite, time da
  semana, fase do elenco, evolução do skill rating e rankings do elenco (inclui MVPs).
- **Jogadores** e **perfil de cada jogador**: temporada (EA) com posição no elenco, histórico
  salvo, gráfico de notas, melhor partida, rendimento por posição (nota em cada setor) e
  parcerias.
- **Raio-X** (perfil): números da temporada por jogo (gols, assistências, passes, desarmes,
  % de acerto, MVPs, nota) com a barra do percentil dentro do elenco, estilo Sofascore.
- **Impacto em campo**: aproveitamento do time com e sem cada jogador (compara quando há 3+
  jogos dos dois lados).
- **Jogos decisivos**: campanha nas partidas decididas por até 1 gol e quem tem nota melhor
  nelas do que no geral.
- **Prêmios do mês**: Bola de Ouro, artilheiro, garçom, muralha (desarmes) e bagre do mês, com
  card para o WhatsApp.
- **Em alta / em baixa**: média dos últimos 5 jogos comparada com a média da temporada; ±0,3
  ou mais marca a fase (precisa de 3+ partidas salvas).
- **Time da semana** (segunda a domingo, horário de Brasília): titulares por setor num 4-3-3,
  pela nota média de quem jogou ao menos um terço das partidas da semana; craque, banco e
  card para o WhatsApp.
- **Partidas** agrupadas por noite (partidas a menos de 3 h uma da outra) e **resumo da noite**
  com MVP, artilheiro, garçom e notas — com botão de compartilhar.
- **Recordes**: goleadas, sequências, cansaço da noite (aproveitamento do 1º ao último jogo e
  1ª × 2ª metade), atuações individuais, hat-tricks, duplas e conexões de assistência
  (somente as garantidas pelos números de cada partida — a EA não informa lance a lance).
- **Prévias para WhatsApp**: links do resumo da noite, do time da semana, dos prêmios do mês,
  das formações e do perfil geram imagem com os números (`opengraph-image.tsx`, fontes Barlow em `assets/fonts`, licença SIL
  OFL).
- **Evolução do skill rating**: a EA só informa o valor atual; cada jogo de liga novo vira um
  ponto em `club_progress`.

## Montador de formação

`/clubs/[clubId]/formations` — escolha o esquema (4-3-3, 4-2-3-1, 4-4-2, 4-1-2-1-2,
4-3-2-1, 3-5-2, 3-4-3, 5-3-2), clique em cada posição e defina jogador (ou IA), arquétipo
do FC 27, até 6 pontos fortes (atributos como Curva e Passe curto) e uma observação. Ao
escolher o jogador, o montador mostra a nota de cada um naquele setor e sugere quem rende mais.
Também dá para definir capitão e cobradores de pênalti, falta e escanteio.

Abrir uma formação mostra a **escalação de TV**: cartas estilo FUT (OVR, vaga, arquétipo, nota
no setor e fase), **linhas de química** ligando quem dá assistência para quem entre os
escalados, ficha do time, bola parada e o plano de jogo de cada vaga. A edição fica em
`/formations/[id]/edit`.

- Arquétipos, atributos e esquemas são dados em [`src/lib/formations/`](src/lib/formations/) —
  se a EA mudar algo num patch, só esses arquivos mudam.
- Trocar o esquema remapeia as vagas por setor e proximidade (o atacante continua atacante).
- Posição e coordenadas de cada vaga vêm do esquema no servidor, nunca do navegador.
- Bancos criados antes desta versão: rode
  [`supabase/migrations/20261005_formation_slots.sql`](supabase/migrations/20261005_formation_slots.sql)
  e [`supabase/migrations/20261006_formation_roles.sql`](supabase/migrations/20261006_formation_roles.sql).

> Sem login nesta versão: qualquer pessoa com o link pode editar as formações.

## Próximos passos sugeridos

- Proteger a edição de formações (ex.: código do clube) quando o link circular além do grupo.
- Estatísticas por jogador calculadas a partir do histórico salvo (não só o total da EA).
- Filtro de partidas por tipo e por adversário.
- Tratar troca de gamertag (mesmo `ea_player_id` com nome diferente).
