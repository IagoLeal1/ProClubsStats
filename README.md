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
| `CRON_SECRET` | opcional, `openssl rand -hex 32` | Protege `/api/cron/sync` |

A service role nunca chega ao browser: os módulos que a usam importam `server-only`, e o
build falha se algum Client Component tentar importá-los.

### Scripts

```bash
npm run dev        # desenvolvimento
npm run lint       # ESLint
npm run typecheck  # gera tipos de rota do Next + tsc --noEmit
npm run build      # build de produção
```

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente acima (Production e Preview).
3. Deploy. O [`vercel.json`](vercel.json) agenda `/api/cron/sync` uma vez por dia (limite do
   plano Hobby). No plano Pro, aumente a frequência (ex.: `*/30 * * * *`) para não perder
   partidas de clubes que jogam muito.

> ⚠️ A API da EA fica atrás do Akamai. Os testes foram feitos de rede residencial; confirme
> após o deploy que as chamadas a partir da Vercel não recebem 403.

## Arquitetura

```
src/
├── app/                      # rotas (Server Components por padrão)
│   ├── page.tsx              # /            busca + clubes recentes
│   ├── search/               # /search      resultados da EA + clubes já salvos
│   ├── clubs/[clubId]/       # dashboard, players, matches, matches/[matchId], formations
│   ├── actions/sync-club.ts  # Server Actions: abrir clube / atualizar
│   └── api/cron/sync/        # Route Handler para sincronização agendada
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

**Pendente de validação:** partidas de playoff (sem amostra), cartões amarelos e interceptações
(sem campo), mandante/visitante (sem campo), códigos de posição além de CB/CM/ST, nome da
região, semântica de `winnerByDnf`, chamadas a partir de IPs da Vercel.

## Próximos passos sugeridos

- Editor de formações (estrutura de banco e componentes `FootballPitch`/`FormationPlayer` prontos).
- Estatísticas por jogador calculadas a partir do histórico salvo (não só o total da EA).
- Filtro de partidas por tipo e por adversário.
- Tratar troca de gamertag (mesmo `ea_player_id` com nome diferente).
