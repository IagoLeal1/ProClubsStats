import type { Metadata } from "next";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import {
  ArrowRightIcon,
  BotIcon,
  DatabaseIcon,
  HashIcon,
  type LucideIcon,
  RefreshCwIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react";

import { CodeLayers } from "@/components/architecture/CodeLayers";
import { COMPUTED, EA_LIMITS, ENV_VARS, STORED } from "@/components/architecture/content";
import { DatabaseExplorer } from "@/components/architecture/DatabaseExplorer";
import { SectionNav, type NavSection } from "@/components/architecture/SectionNav";
import { SyncSteps } from "@/components/architecture/SyncSteps";
import { SystemMap } from "@/components/architecture/SystemMap";
import { WhereToChange } from "@/components/architecture/WhereToChange";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRecentlySyncedClubs } from "@/lib/db/clubs.repository";
import { countTableRows } from "@/lib/db/site.repository";
import { logServerError } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Por dentro do FC Clubs Stats: onde fica o backend, como os dados saem da EA e chegam às páginas, o banco e onde mexer no código.",
};

const SECTIONS: NavSection[] = [
  { id: "mapa", label: "Mapa" },
  { id: "backend", label: "Backend" },
  { id: "clubes", label: "Qualquer clube" },
  { id: "sincronizacao", label: "Sincronização" },
  { id: "camadas", label: "Camadas" },
  { id: "banco", label: "Banco" },
  { id: "guardado", label: "Guardado ou calculado" },
  { id: "limites", label: "Limites da EA" },
  { id: "deploy", label: "Deploy" },
  { id: "mexer", label: "Onde mexer" },
];

const STACK: { name: string; role: string }[] = [
  { name: "Next.js 16", role: "telas" },
  { name: "TypeScript", role: "tudo" },
  { name: "Supabase Postgres", role: "banco" },
  { name: "GitHub Actions", role: "sincronização" },
  { name: "Vercel", role: "hospedagem" },
  { name: "Tailwind + shadcn/ui", role: "visual" },
  { name: "Zod", role: "validação" },
];

const BACKEND: { icon: LucideIcon; where: string; title: string; text: string }[] = [
  {
    icon: ServerIcon,
    where: "Vercel · gru1 (São Paulo)",
    title: "Servidor do Next.js",
    text: "Funções que sobem a cada visita: montam as páginas no servidor, salvam as formações e geram os cards do WhatsApp. Não guardam nada entre uma visita e outra.",
  },
  {
    icon: DatabaseIcon,
    where: "Supabase · sa-east-1 (São Paulo)",
    title: "Postgres 17",
    text: "O banco, com uma API automática na frente. Na mesma cidade da Vercel, então cada consulta faz uma viagem curta. Qualquer um lê; só a chave secreta grava.",
  },
  {
    icon: BotIcon,
    where: "GitHub Actions · servidores do GitHub",
    title: "Robô de sincronização",
    text: "Um script em Node 24 que liga, conversa com a EA, grava no banco e desliga. É o único que a EA aceita, e roda de graça porque o repositório é público.",
  },
];

const CLUB_ENTRY: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: SearchIcon,
    title: "Buscar pelo nome",
    text: "Acha os clubes que o site já acompanha. A busca por nome na EA também é bloqueada na Vercel, então clubes novos entram pelo ID.",
  },
  {
    icon: HashIcon,
    title: "Adicionar pelo ID",
    text: "Com o ID do clube na EA, o botão “Adicionar clube” pede ao robô para buscá-lo. Em 1 a 2 minutos ele aparece, com as partidas que a EA ainda guarda.",
  },
  {
    icon: RefreshCwIcon,
    title: "Manter atualizado",
    text: "A cada 15 minutos o agendamento sincroniza até 20 clubes, começando pelos que estão há mais tempo sem atualizar.",
  },
];

/** Contagens compartilhadas entre o topo e o banco (uma consulta por visita). */
const loadCounts = cache(async () => {
  await connection();
  try {
    return await countTableRows();
  } catch (error) {
    logServerError("arquitetura:counts", error);
    return null;
  }
});

export default function ArchitecturePage() {
  return (
    <Container className="pt-10 sm:pt-14">
      <header className="max-w-3xl space-y-5">
        <p className="kicker text-primary">Por dentro do site</p>
        <h1 className="figure text-5xl uppercase sm:text-7xl">Como o FC Clubs Stats funciona</h1>
        <p className="text-muted-foreground sm:text-lg">
          O site acompanha qualquer clube do Pro Clubs: lê os números na API da EA, guarda tudo num banco Postgres e
          monta as páginas a partir desse histórico. A peça menos óbvia: quem conversa com a EA não é o site na
          Vercel, e sim um robô no GitHub Actions, porque a EA bloqueia os servidores da Vercel.
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Tecnologias">
          {STACK.map((item) => (
            <li key={item.name}>
              <Badge variant="outline" className="h-6 px-2.5 text-xs">
                {item.name}
                <span className="font-normal text-muted-foreground">· {item.role}</span>
              </Badge>
            </li>
          ))}
        </ul>
      </header>

      <Suspense fallback={<LiveNumbersSkeleton />}>
        <LiveNumbers />
      </Suspense>

      <div className="mt-10">
        <SectionNav sections={SECTIONS} />
      </div>

      <div className="space-y-16 pt-10 sm:space-y-20 [&>section]:scroll-mt-32">
        <section id="mapa">
          <SectionHeading
            title="Mapa geral"
            description="Cinco peças e quem fala com quem. Escolha um fluxo para ver os dados andando, ou toque numa peça."
          />
          <SystemMap />
        </section>

        <section id="backend">
          <SectionHeading
            title="Onde fica o backend"
            description="Não existe um servidor próprio ligado o tempo todo: são três serviços gerenciados, dois deles em São Paulo."
          />
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {BACKEND.map(({ icon: Icon, where, title, text }) => (
              <li key={title} className="space-y-2.5 border border-t-[3px] border-t-primary bg-card p-5">
                <Icon className="size-6 text-primary" aria-hidden />
                <p className="kicker text-primary">{where}</p>
                <h3 className="font-display text-2xl font-bold uppercase">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="clubes">
          <SectionHeading
            title="Qualquer clube"
            description="Nada no código fica preso a um clube: qualquer um do Pro Clubs pode ser acompanhado, no crossplay ou no Switch."
          />
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {CLUB_ENTRY.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex gap-4 border bg-card p-5">
                <span className="figure text-4xl text-primary">{index + 1}</span>
                <div className="space-y-1.5">
                  <h3 className="flex items-center gap-2 font-display text-xl font-bold uppercase">
                    <Icon className="size-4 text-muted-foreground" aria-hidden />
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="sincronizacao">
          <SectionHeading
            title="Uma sincronização"
            description="O mesmo fluxo roda pelo agendamento, pelo botão ou pela visita a um clube desatualizado. Rodar duas vezes não duplica nada."
          />
          <SyncSteps />
        </section>

        <section id="camadas">
          <SectionHeading
            title="Camadas do código"
            description="Toque numa camada para ver do que ela depende e quem depende dela."
          />
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Rule path="src/lib/ea" text="fala com a EA" />
            <Rule path="src/lib/db" text="fala com o banco" />
          </div>
          <CodeLayers />
        </section>

        <section id="banco">
          <SectionHeading
            title="O banco"
            description="Nove tabelas, com a contagem de agora. Toque numa para ver com quem ela se liga e o que guarda."
          />
          <Suspense fallback={<DatabaseExplorer counts={null} />}>
            <DatabaseWithCounts />
          </Suspense>
          <p className="mt-3 text-sm text-muted-foreground">
            O schema completo fica em <Code>supabase/schema.sql</Code> e cada mudança entra como migração em{" "}
            <Code>supabase/migrations/</Code>.
          </p>
        </section>

        <section id="guardado">
          <SectionHeading
            title="Guardado ou calculado"
            description="O banco guarda só o que a EA informou. Todo o resto é calculado na hora em que a página abre."
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FactList title="Guardado" items={STORED} />
            <FactList title="Calculado ao abrir" items={COMPUTED} highlight>
              Melhorar uma fórmula muda todo o histórico de uma vez, sem rodar nada no banco. O preço é que cada visita
              relê o histórico do clube; quando ele crescer muito, vale guardar as páginas prontas até a próxima
              sincronização.
            </FactList>
          </div>
        </section>

        <section id="limites">
          <SectionHeading
            title="O que a EA não dá"
            description="A API do Pro Clubs não é oficial nem documentada. Estes limites moldaram várias decisões."
          />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EA_LIMITS.map((limit) => (
              <li key={limit.title} className="space-y-2 border bg-card p-5">
                <h3 className="font-display text-xl font-bold uppercase">{limit.title}</h3>
                <p className="text-sm text-muted-foreground">{limit.text}</p>
                <p className="flex gap-2 text-sm">
                  <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {limit.consequence}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="deploy">
          <SectionHeading
            title="Deploy e configuração"
            description="Um git push no main publica o site: a Vercel faz o build e põe no ar. O GitHub Actions sempre roda o código do main, então a sincronização nova vale na execução seguinte."
          />
          <div className="border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="kicker">Configuração</TableHead>
                  <TableHead className="kicker max-md:hidden">Onde fica</TableHead>
                  <TableHead className="kicker">Para quê</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ENV_VARS.map((env) => (
                  <TableRow key={env.name}>
                    <TableCell className="align-top">
                      <code className="font-mono text-xs break-all whitespace-normal">{env.name}</code>
                      {env.secret && (
                        <Badge variant="outline" className="mt-1.5 flex border-loss/50 text-loss">
                          secreta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal text-muted-foreground max-md:hidden">
                      {env.where}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      {env.purpose}
                      <span className="mt-1 block text-xs text-muted-foreground md:hidden">{env.where}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Os valores nunca ficam no código: cada um é configurado na Vercel, no GitHub e no <Code>.env.local</Code>.
          </p>
        </section>

        <section id="mexer">
          <SectionHeading
            title="Onde mexer para…"
            description="O caminho mais curto para as mudanças mais comuns. Toque num caminho para copiar."
          />
          <WhereToChange />
        </section>

        <p className="border-t pt-6 text-sm text-muted-foreground">
          Retrato do código em 15/10/2026. O código é aberto:{" "}
          <a
            href="https://github.com/IagoLeal1/ProClubsStats"
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/IagoLeal1/ProClubsStats
          </a>
          .
        </p>
      </div>
    </Container>
  );
}

async function LiveNumbers() {
  const [counts, lastSyncedAt] = await Promise.all([
    loadCounts(),
    listRecentlySyncedClubs(1)
      .then((clubs) => clubs[0]?.lastSyncedAt ?? null)
      .catch((error: unknown) => {
        logServerError("arquitetura:lastSync", error);
        return null;
      }),
  ]);
  if (!counts) return null;

  const format = new Intl.NumberFormat("pt-BR");
  const tiles = [
    { label: "Clubes acompanhados", value: format.format(counts.clubs) },
    { label: "Partidas guardadas", value: format.format(counts.matches) },
    { label: "Atuações de jogadores", value: format.format(counts.player_match_stats) },
    { label: "Última sincronização", value: lastSyncedAt ? formatRelativeTime(lastSyncedAt) : "—" },
  ];

  return (
    <section aria-label="Agora no banco" className="mt-8 space-y-2.5">
      <p className="kicker flex items-center gap-2 text-muted-foreground">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Agora no banco
      </p>
      <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="space-y-1.5 border bg-card px-4 py-3.5">
            <dt className="kicker text-[11px] text-muted-foreground">{tile.label}</dt>
            <dd className="figure text-3xl first-letter:uppercase tabular sm:text-4xl">{tile.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LiveNumbersSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-2 pt-7 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[84px] rounded-none" />
      ))}
    </div>
  );
}

async function DatabaseWithCounts() {
  return <DatabaseExplorer counts={await loadCounts()} />;
}

function Rule({ path, text }: { path: string; text: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-l-[3px] border-primary bg-card px-4 py-3 text-sm">
      Só <Code>{path}</Code> {text}.
    </p>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs">{children}</code>;
}

interface FactListProps {
  title: string;
  items: string[];
  highlight?: boolean;
  children?: React.ReactNode;
}

function FactList({ title, items, highlight, children }: FactListProps) {
  return (
    <div className={highlight ? "space-y-4 border border-t-[3px] border-t-primary bg-card p-5" : "space-y-4 border bg-card p-5"}>
      <h3 className="font-display text-2xl font-bold uppercase">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 bg-primary" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      {children && <p className="border-t pt-3 text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}
