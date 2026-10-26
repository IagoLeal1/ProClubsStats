/**
 * Conteúdo da página /arquitetura. Tudo aqui descreve o código como ele é:
 * ao mudar a sincronização, o banco ou as camadas, atualize junto.
 */

export type NodeId = "you" | "vercel" | "supabase" | "actions" | "ea";

export type EdgeId =
  | "you-vercel"
  | "vercel-you"
  | "vercel-supabase"
  | "vercel-ea"
  | "vercel-actions"
  | "actions-ea"
  | "actions-supabase"
  | "supabase-actions";

export interface MapNode {
  id: NodeId;
  name: string;
  /** Título e linhas curtas desenhados dentro da caixa do mapa. */
  title: string;
  lines: string[];
  where: string;
  role: string;
  code: string[];
}

export const MAP_NODES: MapNode[] = [
  {
    id: "you",
    name: "Vocês",
    title: "VOCÊS",
    lines: ["navegador"],
    where: "Qualquer navegador, no celular ou no computador",
    role: "Recebem as páginas já montadas. Só o que é interativo, como a prancheta, os botões e esta página, roda no navegador.",
    code: [],
  },
  {
    id: "vercel",
    name: "Vercel",
    title: "VERCEL · NEXT.JS",
    lines: ["monta as páginas", "São Paulo (gru1)"],
    where: "Vercel, região gru1 (São Paulo)",
    role: "Monta cada página no servidor lendo o banco, salva as formações e gera os cards do WhatsApp. Não guarda nada entre uma visita e outra.",
    code: ["src/app", "vercel.json"],
  },
  {
    id: "supabase",
    name: "Supabase",
    title: "SUPABASE POSTGRES",
    lines: ["partidas, jogadores,", "evolução e formações"],
    where: "Supabase, sa-east-1 (São Paulo)",
    role: "Postgres 17 com uma API automática na frente. Guarda o que a EA informou e as formações montadas no site. Qualquer um lê; só a chave secreta grava.",
    code: ["supabase/schema.sql", "src/lib/db"],
  },
  {
    id: "actions",
    name: "GitHub Actions",
    title: "GITHUB ACTIONS",
    lines: ["npm run sync · Node 24", "a cada 15 min ou a pedido"],
    where: "Servidores do GitHub",
    role: "O robô de sincronização: liga, busca na EA, grava no banco e desliga. É o único que a EA aceita, e roda de graça porque o repositório é público.",
    code: [".github/workflows/sync-clubs.yml", "scripts/sync-clubs.ts"],
  },
  {
    id: "ea",
    name: "API da EA",
    title: "API DA EA",
    lines: ["proclubs.ea.com/api/fc", "não oficial · só leitura"],
    where: "proclubs.ea.com/api/fc",
    role: "A API por trás das páginas de Pro Clubs no site da EA. Não é oficial nem documentada, só guarda as 10 últimas partidas de cada tipo e bloqueia os servidores da Vercel.",
    code: ["src/lib/ea", "docs/ea-endpoints.md"],
  },
];

export interface MapEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  label: string;
  detail?: string;
  blocked?: boolean;
}

export const MAP_EDGES: MapEdge[] = [
  { id: "you-vercel", from: "you", to: "vercel", label: "pede a página" },
  { id: "vercel-you", from: "vercel", to: "you", label: "página pronta" },
  { id: "vercel-supabase", from: "vercel", to: "supabase", label: "lê", detail: "chave pública" },
  { id: "vercel-ea", from: "vercel", to: "ea", label: "bloqueado (403)", blocked: true },
  { id: "vercel-actions", from: "vercel", to: "actions", label: "pede sincronização", detail: "workflow_dispatch" },
  { id: "actions-ea", from: "actions", to: "ea", label: "busca clube, membros", detail: "e partidas" },
  { id: "actions-supabase", from: "actions", to: "supabase", label: "grava", detail: "chave secreta" },
  { id: "supabase-actions", from: "supabase", to: "actions", label: "lista clubes", detail: "desatualizados" },
];

export interface ScenarioStep {
  /** Linha percorrida neste passo; sem linha, o passo acontece dentro de `node`. */
  edge?: EdgeId;
  node: NodeId;
  title: string;
  text: string;
}

export interface Scenario {
  id: string;
  label: string;
  steps: ScenarioStep[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "visita",
    label: "Abrir um clube",
    steps: [
      {
        edge: "you-vercel",
        node: "vercel",
        title: "Você abre o clube",
        text: "O navegador pede a página ao servidor do Next.js na Vercel, em São Paulo.",
      },
      {
        edge: "vercel-supabase",
        node: "supabase",
        title: "Lê o histórico",
        text: "O servidor lê o clube, as partidas e as estatísticas no Supabase com a chave pública, que só lê. As consultas rodam em paralelo, na mesma cidade.",
      },
      {
        node: "vercel",
        title: "Calcula tudo na hora",
        text: "Noites, MVP, recordes, time da semana e prêmios saem das partidas salvas. Nada disso fica guardado no banco: uma fórmula nova vale para todo o histórico.",
      },
      {
        edge: "vercel-you",
        node: "you",
        title: "Página pronta",
        text: "O HTML chega montado. Se os dados passaram de 20 minutos, o site ainda pede uma sincronização depois de responder, pelo mesmo caminho do botão Atualizar.",
      },
    ],
  },
  {
    id: "atualizar",
    label: "Atualizar",
    steps: [
      {
        edge: "you-vercel",
        node: "vercel",
        title: "Você toca em Atualizar",
        text: "O botão chama uma ação no servidor da Vercel. Se o clube foi sincronizado há menos de 2 minutos, nada acontece.",
      },
      {
        edge: "vercel-ea",
        node: "vercel",
        title: "Tenta a EA e leva 403",
        text: "O firewall da EA (Akamai) recusa os servidores da Vercel. O site reconhece esse bloqueio e, em vez de mostrar erro, segue para o plano B.",
      },
      {
        edge: "vercel-actions",
        node: "actions",
        title: "Pede ao GitHub Actions",
        text: "Um workflow_dispatch com o ID do clube. Vários amigos tocando ao mesmo tempo viram no máximo uma execução rodando e uma na fila.",
      },
      {
        edge: "actions-ea",
        node: "ea",
        title: "Busca na EA",
        text: "Os servidores do GitHub com Node 24 passam pelo firewall: perfil e divisão do clube, membros e as 10 últimas partidas de cada tipo.",
      },
      {
        edge: "actions-supabase",
        node: "supabase",
        title: "Grava no banco",
        text: "Com a chave secreta e sem duplicar nada. Do toque até aqui leva de 1 a 2 minutos; a próxima visita já lê os dados novos.",
      },
    ],
  },
  {
    id: "novo",
    label: "Clube novo",
    steps: [
      {
        edge: "you-vercel",
        node: "vercel",
        title: "Busca pelo ID",
        text: "Na busca, digite o ID numérico do clube na EA. A busca por nome na EA também é bloqueada na Vercel, então ela só acha clubes que o site já acompanha.",
      },
      {
        edge: "vercel-actions",
        node: "actions",
        title: "Adicionar clube",
        text: "O botão pede ao GitHub Actions para sincronizar aquele ID.",
      },
      {
        edge: "actions-ea",
        node: "ea",
        title: "Busca o clube na EA",
        text: "Perfil, divisão, membros e as partidas que a EA ainda guarda: as 10 últimas de cada tipo.",
      },
      {
        edge: "actions-supabase",
        node: "supabase",
        title: "Clube criado",
        text: "Em 1 a 2 minutos ele aparece na busca. Daí em diante, o agendamento de 15 em 15 minutos cuida dele.",
      },
    ],
  },
  {
    id: "agendamento",
    label: "A cada 15 min",
    steps: [
      {
        node: "actions",
        title: "O relógio dispara",
        text: "O GitHub roda o workflow sozinho a cada 15 minutos, mesmo sem ninguém no site. Em horários de pico ele pode atrasar alguns minutos.",
      },
      {
        edge: "supabase-actions",
        node: "actions",
        title: "Escolhe os clubes",
        text: "Até 20 clubes sem sincronizar há mais de 10 minutos, começando pelos mais antigos.",
      },
      {
        edge: "actions-ea",
        node: "ea",
        title: "Busca um por um",
        text: "Um clube de cada vez, para não forçar a EA.",
      },
      {
        edge: "actions-supabase",
        node: "supabase",
        title: "Nenhuma partida se perde",
        text: "A EA só guarda as 10 últimas partidas de cada tipo, e 10 jogos levam mais de duas horas e meia. Rodando a cada 15 minutos, tudo entra no histórico.",
      },
    ],
  },
];

export interface SyncStep {
  title: string;
  text: string;
  file: string;
  writes: string[];
}

export const SYNC_STEPS: SyncStep[] = [
  {
    title: "Gatilho",
    text: "Agendamento a cada 15 minutos, botão Atualizar, clube novo adicionado pelo ID ou visita a um clube com dados de mais de 20 minutos. Pedidos repetidos viram no máximo uma execução rodando e uma na fila.",
    file: "scripts/sync-clubs.ts",
    writes: [],
  },
  {
    title: "Clube",
    text: "Perfil, campanha e skill rating. A divisão vem da busca do ranking, o único lugar onde a EA a informa; se essa busca falhar, a divisão salva antes continua lá. É a única etapa obrigatória: sem o clube, nada segue.",
    file: "src/services/sync/club-sync.service.ts",
    writes: ["clubs", "club_progress"],
  },
  {
    title: "Jogadores",
    text: "Membros com as estatísticas da temporada e o OVR. Quem sai do clube vira ex-membro e nunca é apagado. Vem antes das partidas porque as partidas são ligadas aos membros salvos.",
    file: "src/services/sync/player-sync.service.ts",
    writes: ["players", "player_progress"],
  },
  {
    title: "Partidas",
    text: "Liga, playoff e amistoso: as 10 últimas de cada. Cada partida ganha uma impressão digital (ea:<id>), então buscar a mesma partida de novo não duplica nada.",
    file: "src/services/sync/match-sync.service.ts",
    writes: ["matches", "match_team_stats", "player_match_stats"],
  },
  {
    title: "Pronto",
    text: "A próxima visita já lê os dados novos. Se jogadores ou partidas falharem, o resto segue e a página avisa que a sincronização foi parcial.",
    file: "src/services/sync/sync.service.ts",
    writes: [],
  },
];

export type LayerId = "app" | "components" | "stats" | "script" | "sync" | "db" | "ea";

export interface CodeLayer {
  id: LayerId;
  path: string;
  name: string;
  text: string;
  uses: LayerId[];
}

/** Ordem de leitura: telas à esquerda, sincronização à direita, acesso a dados embaixo. */
export const CODE_LAYERS: CodeLayer[] = [
  {
    id: "app",
    path: "src/app",
    name: "Telas",
    text: "As rotas do site. Cada página lê o banco no servidor, passa os dados pelos cálculos e entrega o HTML pronto. Aqui também ficam as ações que salvam formações e os cards do WhatsApp.",
    uses: ["components", "stats", "db", "sync", "ea"],
  },
  {
    id: "script",
    path: "scripts/sync-clubs.ts",
    name: "Script do robô",
    text: "O que o GitHub Actions executa: escolhe os clubes desatualizados (ou o ID pedido) e chama a sincronização de um por um.",
    uses: ["sync", "db"],
  },
  {
    id: "components",
    path: "src/components",
    name: "Peças visuais",
    text: "Tabelas, cards, gráficos, a prancheta. Recebem dados prontos e usam os cálculos para formatar; não acessam banco nem EA.",
    uses: ["stats"],
  },
  {
    id: "stats",
    path: "src/lib/stats",
    name: "Cálculos puros",
    text: "Recebem partidas e estatísticas e devolvem números: noites, MVP, recordes, impacto, time da semana. Não acessam nada, então dá para testar com dados de exemplo e trocar uma fórmula sem mexer no resto.",
    uses: [],
  },
  {
    id: "sync",
    path: "src/services/sync",
    name: "Sincronização",
    text: "Clube, depois jogadores, depois partidas. Cada etapa tolera falha da anterior (menos o clube) e tudo é idempotente. Quando a EA bloqueia, pede ao GitHub Actions pelo src/lib/github.",
    uses: ["ea", "db"],
  },
  {
    id: "db",
    path: "src/lib/db",
    name: "Repositórios",
    text: "O único acesso ao Supabase. A leitura usa a chave pública; a escrita usa a chave secreta e só roda no servidor.",
    uses: [],
  },
  {
    id: "ea",
    path: "src/lib/ea",
    name: "Cliente da EA",
    text: "O único acesso à EA: tentativas de novo, tempo limite e validação de cada resposta com Zod, porque a API não é documentada e pode mudar.",
    uses: [],
  },
];

export type TableId =
  | "clubs"
  | "club_progress"
  | "players"
  | "player_progress"
  | "matches"
  | "match_team_stats"
  | "player_match_stats"
  | "formations"
  | "formation_players";

export interface DbTable {
  id: TableId;
  text: string;
  /** Chave natural: o que torna o upsert idempotente. */
  key: string;
  columns: string[];
  /** Tabelas para as quais esta aponta (cada linha daqui pertence a uma de lá). */
  parents: TableId[];
  writtenBy: string;
}

export const DB_TABLES: DbTable[] = [
  {
    id: "clubs",
    text: "O clube como a EA mostra hoje, com divisão, acessos e quedas.",
    key: "ea_club_id + platform",
    columns: ["name", "skill_rating", "wins / draws / losses", "current_division", "last_synced_at"],
    parents: [],
    writtenBy: "Sincronização · etapa Clube",
  },
  {
    id: "club_progress",
    text: "Um retrato a cada jogo: skill rating, campanha e divisão. É daqui que saem a evolução e as subidas e quedas.",
    key: "club_id + games_played",
    columns: ["captured_at", "skill_rating", "games_played", "current_division"],
    parents: ["clubs"],
    writtenBy: "Sincronização · etapa Clube",
  },
  {
    id: "players",
    text: "Membros e ex-membros, com a temporada no clube e o OVR atual.",
    key: "club_id + ea_player_id",
    columns: ["name", "position", "overall", "goals / assists", "average_rating", "is_member"],
    parents: ["clubs"],
    writtenBy: "Sincronização · etapa Jogadores",
  },
  {
    id: "player_progress",
    text: "O OVR de cada Pro a cada jogo, para desenhar a evolução.",
    key: "player_id + games_played",
    columns: ["captured_at", "overall", "games_played"],
    parents: ["players"],
    writtenBy: "Sincronização · etapa Jogadores",
  },
  {
    id: "matches",
    text: "Placar, tipo de jogo, adversário, data e a impressão digital da partida.",
    key: "club_id + fingerprint",
    columns: ["match_type", "played_at", "opponent_name", "goals_for / goals_against", "result"],
    parents: ["clubs"],
    writtenBy: "Sincronização · etapa Partidas",
  },
  {
    id: "match_team_stats",
    text: "Os números do time e do adversário, uma linha para cada lado. Somam só os jogadores, não a IA.",
    key: "match_id + side",
    columns: ["side", "shots", "passes / passes_completed", "tackles", "saves"],
    parents: ["matches"],
    writtenBy: "Sincronização · etapa Partidas",
  },
  {
    id: "player_match_stats",
    text: "A partida de cada jogador: liga uma partida a um jogador.",
    key: "match_id + player_id",
    columns: ["position", "rating", "goals / assists", "shots", "passes", "tackles", "man_of_the_match"],
    parents: ["matches", "players"],
    writtenBy: "Sincronização · etapa Partidas",
  },
  {
    id: "formations",
    text: "As formações montadas no site: esquema, código da tática do FC, capitão e cobradores.",
    key: "id (cada formação é única)",
    columns: ["name", "formation_type", "game_code", "captain_id", "penalty_taker_id"],
    parents: ["clubs", "players"],
    writtenBy: "Site · salvar formação",
  },
  {
    id: "formation_players",
    text: "As 11 vagas da formação: um jogador, ou vazia para a IA.",
    key: "formation_id + slot_index",
    columns: ["slot_index", "position", "x_position / y_position", "archetype", "strengths"],
    parents: ["formations", "players"],
    writtenBy: "Site · salvar formação",
  },
];

export const STORED: string[] = [
  "O clube, os jogadores e as estatísticas da temporada como a EA mostra hoje",
  "Cada partida, com os números do time, do adversário e de cada jogador",
  "A evolução do skill rating, da divisão e do OVR (a EA só informa o valor atual)",
  "As formações montadas no site",
];

export const COMPUTED: string[] = [
  "Noites (partidas com menos de 3 h entre si), resumo e MVP da noite",
  "Time da semana, prêmios do mês, recordes e cansaço da noite",
  "O cara decisivo, conexões de gol e duplas, impacto em campo, jogos apertados",
  "Raio-X, fase (em alta ou em baixa), rendimento por posição, química na escalação",
];

export interface EaLimit {
  title: string;
  text: string;
  consequence: string;
}

export const EA_LIMITS: EaLimit[] = [
  {
    title: "Só as 10 últimas partidas",
    text: "Por tipo de jogo.",
    consequence: "Por isso a sincronização roda a cada 15 minutos: dez jogos levam mais de duas horas e meia.",
  },
  {
    title: "Nenhum lance a lance",
    text: "Não diz quem deu o passe de cada gol.",
    consequence: "As conexões de gol só contam as assistências que os números da partida garantem.",
  },
  {
    title: "A IA não entra",
    text: "Finalizações, passes e desarmes contam só os jogadores.",
    consequence: "Os gols do time usam o placar, que pode ter um gol da IA.",
  },
  {
    title: "Só o setor, não a posição",
    text: "Cada partida diz gol, defesa, meio ou ataque.",
    consequence: "Time da semana e rendimento por posição trabalham por setor.",
  },
  {
    title: "Bloqueio na Vercel",
    text: "O firewall da EA recusa a Vercel e o Node 20.",
    consequence: "O GitHub Actions com Node 24 passa, então ele faz as buscas.",
  },
  {
    title: "Só valores atuais",
    text: "Skill rating, divisão e OVR não têm histórico na EA.",
    consequence: "O site guarda um registro a cada jogo para desenhar a evolução.",
  },
];

export interface EnvVar {
  name: string;
  where: string;
  purpose: string;
  secret?: boolean;
}

export const ENV_VARS: EnvVar[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", where: "Vercel, GitHub (variável), .env.local", purpose: "Endereço do banco" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", where: "Vercel, GitHub (variável), .env.local", purpose: "Chave pública: só lê" },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    where: "Vercel, GitHub (secret), .env.local",
    purpose: "Chave secreta: grava (sincronização e formações)",
    secret: true,
  },
  {
    name: "GITHUB_DISPATCH_TOKEN",
    where: "Vercel",
    purpose: "Deixa o site pedir uma sincronização ao GitHub Actions",
    secret: true,
  },
  { name: "EA_API_BASE_URL", where: "Opcional", purpose: "Troca o endereço da EA (padrão: proclubs.ea.com/api/fc)" },
];

export interface ChangeGuide {
  want: string;
  paths: string[];
  note?: string;
}

export const CHANGE_GUIDES: ChangeGuide[] = [
  {
    want: "Uma estatística nova com dados que já existem",
    paths: ["src/lib/stats/", "src/app/clubs/[clubId]/"],
    note: "Um cálculo novo e a tela que o mostra.",
  },
  {
    want: "Um dado novo da EA",
    paths: ["src/lib/ea/types.ts", "src/lib/ea/mappers.ts", "src/services/sync/", "supabase/migrations/", "src/lib/db/"],
    note: "Validar, mapear, gravar numa etapa, criar a coluna e ler no repositório.",
  },
  { want: "Mudar cores, fontes ou formas", paths: ["src/app/globals.css"], note: "E o design system salvo." },
  {
    want: "Um card novo para o WhatsApp",
    paths: ["opengraph-image.tsx", "src/components/og/"],
    note: "Um opengraph-image.tsx na rota, com as peças prontas.",
  },
  { want: "Esquemas táticos e posições", paths: ["src/lib/formations/templates.ts"] },
  {
    want: "Arquétipos e pontos fortes do FC",
    paths: ["src/lib/formations/archetypes.ts", "src/lib/formations/attributes.ts"],
  },
  { want: "Frequência da sincronização", paths: [".github/workflows/sync-clubs.yml"] },
  { want: "Uma tabela ou coluna nova no banco", paths: ["supabase/migrations/", "supabase/schema.sql", "src/types/database.ts"] },
  { want: "Esta página", paths: ["src/app/arquitetura/", "src/components/architecture/content.ts"] },
];
