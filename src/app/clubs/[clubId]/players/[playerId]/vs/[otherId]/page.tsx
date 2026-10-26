import type { Metadata } from "next";
import { CrownIcon } from "lucide-react";
import { z } from "zod";

import { BackLink } from "@/components/layout/BackLink";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ShareButton } from "@/components/layout/ShareButton";
import { DuelCard } from "@/components/players/DuelCard";
import { DuelLink } from "@/components/players/DuelLink";
import { VersusPicker } from "@/components/players/VersusPicker";
import { SliceStat } from "@/components/stats/SliceStat";
import type { RecordSlice } from "@/lib/stats/sessions";
import { formatDuelValue, VERSUS_SCOPES, type Duel, type Together } from "@/lib/stats/versus";
import type { Player } from "@/types/player";

import { loadVersus } from "./load-versus";

const searchParamsSchema = z.object({
  escopo: z.enum(VERSUS_SCOPES).catch("juntos"),
});

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/players/[playerId]/vs/[otherId]">): Promise<Metadata> {
  const { clubId, playerId, otherId } = await params;
  const { club, a, b, duel } = await loadVersus(clubId, playerId, otherId, "juntos");
  const title = `${a.name} x ${b.name}`;
  return {
    title,
    description: `Duelo no ${club.name}: ${a.name} ${duel.score.a} × ${duel.score.b} ${b.name}.`,
    openGraph: { title: `${club.name} · ${title}` },
  };
}

/** Texto que acompanha o link ao compartilhar no WhatsApp. */
function shareText(a: Player, b: Player, duel: Duel): string {
  const scope = duel.scope === "juntos" ? `nos ${duel.games.a} jogos juntos` : "média por jogo";
  return [
    `⚽ Duelo: ${a.name} x ${b.name}`,
    `${a.name} ${duel.score.a} × ${duel.score.b} ${b.name} (${scope})`,
    ...duel.rows.map(
      (row) => `${row.label}: ${formatDuelValue(row.format, row.a)} × ${formatDuelValue(row.format, row.b)}`,
    ),
  ].join("\n");
}

function Slice({ label, slice }: { label: string; slice: RecordSlice | null }) {
  if (slice) return <SliceStat label={label} slice={slice} />;
  return (
    <div className="flex flex-col gap-1 border bg-card p-4">
      <span className="kicker text-muted-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">Nenhum jogo salvo</span>
    </div>
  );
}

function TogetherSection({ a, b, together }: { a: Player; b: Player; together: Together }) {
  const { higherRating } = together;
  return (
    <section>
      <SectionHeading
        title="Juntos em campo"
        description="Como o time vai com os dois, e com só um deles, nas partidas salvas (aproveitamento: 3 pontos por vitória, 1 por empate)."
      />
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Slice label="Os dois em campo" slice={together.both} />
          <Slice label={`Só ${a.name}`} slice={together.onlyA} />
          <Slice label={`Só ${b.name}`} slice={together.onlyB} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 border bg-card p-4">
            <span className="kicker text-muted-foreground">Nota maior nos jogos juntos</span>
            <TallyLine name={a.name} value={higherRating.a} leading={higherRating.a > higherRating.b} />
            <TallyLine name={b.name} value={higherRating.b} leading={higherRating.b > higherRating.a} />
            {higherRating.ties > 0 && (
              <span className="text-xs text-muted-foreground">{plural(higherRating.ties, "empate", "empates")} de nota</span>
            )}
          </div>
          <div className="flex flex-col gap-2 border bg-card p-4">
            <span className="kicker text-muted-foreground">Assistências de um para o outro</span>
            <TallyLine name={`${a.name} → ${b.name}`} value={together.assistsAToB} />
            <TallyLine name={`${b.name} → ${a.name}`} value={together.assistsBToA} />
            <span className="text-xs text-muted-foreground">
              Só as que os números de cada partida garantem (a EA não informa lance a lance).
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TallyLine({ name, value, leading = false }: { name: string; value: number; leading?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate font-semibold">{name}</span>
      <span className={leading ? "figure text-2xl text-primary tabular" : "figure text-2xl tabular"}>{value}</span>
    </div>
  );
}

export default async function VersusPage({
  params,
  searchParams,
}: PageProps<"/clubs/[clubId]/players/[playerId]/vs/[otherId]">) {
  const [{ clubId, playerId, otherId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const { escopo } = searchParamsSchema.parse(rawSearchParams);
  const { club, a, b, duel, together, candidates } = await loadVersus(clubId, playerId, otherId, escopo);

  const base = `/clubs/${club.id}/players/${a.id}/vs/${b.id}`;
  const pickerPlayers = [...candidates]
    .sort((x, y) => y.stats.gamesPlayed - x.stats.gamesPlayed || x.name.localeCompare(y.name))
    .map((player) => ({ id: player.id, name: player.name }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <BackLink href={`/clubs/${club.id}/players`}>Jogadores</BackLink>
        <DuelLink href={`/clubs/${club.id}/players/x1`} label="Rei do x1" icon={CrownIcon} variant="secondary" />
      </div>

      <VersusPicker
        clubId={club.id}
        players={pickerPlayers}
        aId={a.id}
        bId={b.id}
        query={duel.scope === "geral" ? "?escopo=geral" : ""}
      />

      <div className="space-y-3">
        <DuelCard
          a={a}
          b={b}
          duel={duel}
          scopeHrefs={{ juntos: together.both ? base : null, geral: `${base}?escopo=geral` }}
        />
        <ShareButton
          text={shareText(a, b, duel)}
          title={`${club.name} · duelo`}
          label="Mandar no grupo"
          className="w-full sm:w-auto"
        />
      </div>

      <TogetherSection a={a} b={b} together={together} />
    </div>
  );
}
