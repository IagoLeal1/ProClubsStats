import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CalendarXIcon, StarIcon } from "lucide-react";

import { SeriesChart, type SeriesChartPoint } from "@/components/charts/SeriesChart";
import { ClubCrest } from "@/components/clubs/ClubCrest";
import { BackLink } from "@/components/layout/BackLink";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { RESULT_LETTERS } from "@/components/matches/MatchResult";
import { FormBadge } from "@/components/players/FormBadge";
import { PlayerMatchLog } from "@/components/players/PlayerMatchLog";
import { PositionSplits } from "@/components/players/PositionSplits";
import { RatingBadge } from "@/components/players/RatingBadge";
import { ScoutReport } from "@/components/players/ScoutReport";
import { AssistLinks } from "@/components/records/AssistLinks";
import { ImpactDelta } from "@/components/records/ImpactTable";
import { StatCard } from "@/components/stats/StatCard";
import {
  listAllClubMatches,
  listClubPlayerMatchStats,
  listPlayerMatchHistory,
} from "@/lib/db/matches.repository";
import { getPlayerById, listPlayersByClub } from "@/lib/db/players.repository";
import {
  formatDateTime,
  formatInteger,
  formatPercent,
  formatPositionGroupShort,
  formatRating,
} from "@/lib/format";
import { ratingScale } from "@/lib/stats/chart-scale";
import { computeForm, type PlayerForm } from "@/lib/stats/form";
import { computeImpact, MIN_IMPACT_GAMES, type PlayerImpact } from "@/lib/stats/impact";
import {
  computeAssistLinks,
  computePairs,
  type AssistLink,
  type PlayerPair,
} from "@/lib/stats/partnerships";
import {
  rankInSquad,
  summarizePlayerHistory,
  type PlayerHistorySummary,
  type SquadRank,
} from "@/lib/stats/player-history";
import { goalsAndAssists } from "@/lib/stats/player-stats";
import { splitByPosition } from "@/lib/stats/positions";
import { MIN_SCOUT_GAMES, scoutPlayer } from "@/lib/stats/scouting";
import { cn } from "@/lib/utils";
import type { Club } from "@/types/club";
import type { PlayerMatchEntry } from "@/types/match";
import type { Player } from "@/types/player";

import { isValidId, loadClub } from "../../load-club";

/** Quantas partidas aparecem no gráfico de notas. */
const CHART_MATCHES = 20;
/** Mínimo de jogos juntos para aparecer como parceiro. */
const MIN_PARTNER_GAMES = 3;

const loadPlayer = cache(async (clubId: string, playerId: string) => {
  const club = await loadClub(clubId);
  if (!isValidId(playerId)) notFound();
  const player = await getPlayerById(club.id, playerId);
  if (!player) notFound();
  return { club, player };
});

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/players/[playerId]">): Promise<Metadata> {
  const { clubId, playerId } = await params;
  const { player } = await loadPlayer(clubId, playerId);
  return { title: player.name };
}

const rankBadge = (rank: SquadRank | null) => (rank ? `${rank.position}º` : undefined);

/** Eixo X do gráfico: dia e hora, porque várias partidas costumam ser no mesmo dia. */
const axisDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function contributionLabel(goals: number, assists: number): string | null {
  const parts = [
    goals > 0 && `${goals} ${goals === 1 ? "gol" : "gols"}`,
    assists > 0 && `${assists} ${assists === 1 ? "assistência" : "assistências"}`,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function toRatingPoints(entries: PlayerMatchEntry[]): SeriesChartPoint[] {
  return entries
    .filter((entry) => entry.stats.rating !== null)
    .slice(0, CHART_MATCHES)
    .reverse()
    .map(({ match, stats }) => {
      const contribution = contributionLabel(stats.goals, stats.assists);
      return {
        key: match.id,
        href: `/clubs/${match.clubId}/matches/${match.id}`,
        value: stats.rating ?? 0,
        axisLabel: axisDate.format(new Date(match.playedAt)),
        title: `vs ${match.opponent.name}`,
        result: { value: match.result, label: `${match.goalsFor}–${match.goalsAgainst}` },
        details: [formatDateTime(match.playedAt), ...(contribution ? [contribution] : [])],
      };
    });
}

function RatingChart({ history, average }: { history: PlayerMatchEntry[]; average: number | null }) {
  const points = toRatingPoints(history);
  if (points.length === 0) return <p className="text-sm text-muted-foreground">Sem notas registradas.</p>;
  return (
    <SeriesChart
      points={points}
      variant="bar"
      valueFormat="rating"
      reference={average === null ? null : { value: average, label: `média ${formatRating(average)}` }}
      ariaLabel={`Notas das últimas ${points.length} partidas${
        average === null ? "" : `, média ${formatRating(average)}`
      }`}
      {...ratingScale()}
    />
  );
}

interface Accolades {
  topScorer: boolean;
  topAssister: boolean;
  topMvp: boolean;
}

function PlayerHero({
  club,
  player,
  accolades,
  form,
}: {
  club: Club;
  player: Player;
  accolades: Accolades;
  form: PlayerForm | null;
}) {
  const position = player.position ?? formatPositionGroupShort(player.favoritePosition);
  const badges = [
    accolades.topScorer && "Artilheiro do elenco",
    accolades.topAssister && "Garçom do elenco",
    accolades.topMvp && "Mais MVPs do elenco",
    !player.isMember && "Ex-membro",
  ].filter((badge): badge is string => Boolean(badge));

  return (
    <section className="relative overflow-hidden border bg-card px-5 py-7 sm:px-8 sm:py-9">
      <span
        aria-hidden
        className="figure pointer-events-none absolute -top-6 -right-3 text-[12rem] text-surface select-none sm:text-[16rem]"
      >
        {position}
      </span>
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClubCrest name={club.name} src={club.crestUrl} size={28} />
          <span className="kicker text-muted-foreground">{club.name}</span>
        </div>
        <h2 className="figure text-6xl break-all uppercase sm:text-8xl">{player.name}</h2>
        {player.proName && <p className="text-muted-foreground">{player.proName}</p>}
        <div className="flex flex-wrap gap-2">
          <span className="clip-slant flex h-8 items-center bg-primary px-4 font-display text-base font-extrabold text-primary-foreground">
            {position}
          </span>
          {player.overall !== null && (
            <span className="flex h-8 items-center border border-input px-3 font-display text-base font-bold">
              {player.overall} OVR
            </span>
          )}
          {badges.map((badge) => (
            <span
              key={badge}
              className="flex h-8 items-center border border-input px-3 font-display text-base font-bold tracking-[0.04em] uppercase"
            >
              {badge}
            </span>
          ))}
          {form && form.trend !== "steady" && (
            <span
              className={cn(
                "flex h-8 items-center border px-3",
                form.trend === "up" ? "border-win/60" : "border-loss/60",
              )}
            >
              <FormBadge form={form} className="text-base" />
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function HistoryHighlights({ summary }: { summary: PlayerHistorySummary }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="flex flex-col gap-1 border bg-card p-3 sm:p-4">
        <span className="figure text-3xl text-primary sm:text-4xl">{formatPercent(summary.winRate)}</span>
        <span className="text-xs text-muted-foreground">
          vitórias com ele · {summary.wins}V {summary.draws}E {summary.losses}D
        </span>
      </div>
      <div className="flex flex-col gap-1 border bg-card p-3 sm:p-4">
        <span className="figure text-3xl sm:text-4xl">
          {summary.goals}+{summary.assists}
        </span>
        <span className="text-xs text-muted-foreground">gols + assist. · {summary.shots} chutes</span>
      </div>
      <div className="flex flex-col gap-1 border bg-card p-3 sm:p-4">
        <span className="figure text-3xl sm:text-4xl">{formatPercent(summary.passAccuracy)}</span>
        <span className="text-xs text-muted-foreground">
          passes certos · {summary.manOfTheMatch} MVP · nota {formatRating(summary.averageRating)}
        </span>
      </div>
    </div>
  );
}

function FormCard({ form }: { form: PlayerForm }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border bg-card p-4 sm:px-5">
      <div className="flex flex-col gap-1">
        <span className="kicker text-muted-foreground">Fase · últimos {form.ratings.length} jogos</span>
        <div className="flex items-baseline gap-3">
          <span className="figure text-4xl">{formatRating(form.recentAverage)}</span>
          <FormBadge form={form} />
        </div>
        <span className="text-xs text-muted-foreground">média da temporada: {formatRating(form.baseline)}</span>
      </div>
      <ol className="flex gap-1.5" aria-label="Notas dos últimos jogos, do mais antigo ao mais recente">
        {form.ratings.map((rating, index) => (
          <li key={index}>
            <RatingBadge rating={rating} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ImpactCard({ impact }: { impact: PlayerImpact }) {
  const { withPlayer, withoutPlayer, delta } = impact;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border bg-card p-4 sm:px-5">
      <div className="flex flex-col gap-1">
        <span className="kicker text-muted-foreground">Impacto em campo</span>
        <span className="text-sm">
          Com ele: <span className="font-semibold">{formatPercent(withPlayer.pointsRate)}</span> de aproveitamento em{" "}
          {withPlayer.games} jogos
        </span>
        <span className="text-sm text-muted-foreground">
          {withoutPlayer
            ? `Sem ele: ${formatPercent(withoutPlayer.pointsRate)} em ${withoutPlayer.games} jogos`
            : "Jogou todas as partidas salvas"}
        </span>
      </div>
      {delta !== null ? (
        <ImpactDelta delta={delta} className="text-2xl" />
      ) : (
        withoutPlayer && (
          <span className="text-xs text-muted-foreground">
            Precisa de {MIN_IMPACT_GAMES}+ jogos com e sem ele para comparar
          </span>
        )
      )}
    </div>
  );
}

function BestMatch({ entry }: { entry: PlayerMatchEntry }) {
  const { match, stats } = entry;
  return (
    <Link
      href={`/clubs/${match.clubId}/matches/${match.id}`}
      className="flex items-center gap-4 border bg-card px-4 py-3.5 transition-colors hover:bg-surface"
    >
      <span className="figure clip-slant flex h-11 w-16 items-center justify-center bg-primary text-2xl text-primary-foreground">
        {formatRating(stats.rating)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="kicker text-muted-foreground">Melhor partida</span>
        <span className="truncate font-semibold">
          vs {match.opponent.name}
          {stats.goals + stats.assists > 0 && ` · ${contributionLabel(stats.goals, stats.assists)}`}
        </span>
        <span className="text-xs text-muted-foreground">{formatDateTime(match.playedAt)}</span>
      </span>
      <span
        className={cn(
          "figure text-2xl",
          match.result === "W" ? "text-win" : match.result === "L" ? "text-loss" : "text-draw",
        )}
      >
        {RESULT_LETTERS[match.result]} {match.goalsFor}–{match.goalsAgainst}
      </span>
    </Link>
  );
}

function Partnerships({
  clubId,
  player,
  received,
  given,
  partners,
}: {
  clubId: string;
  player: Player;
  received: AssistLink[];
  given: AssistLink[];
  partners: PlayerPair[];
}) {
  const partnerOf = (pair: PlayerPair) => (pair.first.id === player.id ? pair.second : pair.first);
  const boxes = [
    { title: "Quem mais deu assistência pra ele", links: received },
    { title: "Pra quem ele mais deu assistência", links: given },
  ];

  return (
    <section>
      <SectionHeading
        title="Parcerias"
        description="Assistências confirmadas pelos números de cada partida (a EA não informa lance a lance)."
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {boxes.map((box) => (
          <div key={box.title} className="flex flex-col gap-3.5 border bg-card p-4 sm:p-5">
            <span className="kicker text-muted-foreground">{box.title}</span>
            <AssistLinks clubId={clubId} links={box.links} limit={3} />
          </div>
        ))}
        <div className="flex flex-col gap-3.5 border bg-card p-4 sm:p-5">
          <span className="kicker text-muted-foreground">Com quem mais vence ({MIN_PARTNER_GAMES}+ jogos)</span>
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda sem jogos suficientes.</p>
          ) : (
            <ul className="space-y-2.5">
              {partners.map((pair) => {
                const partner = partnerOf(pair);
                return (
                  <li key={partner.id} className="flex items-center justify-between gap-3 font-semibold">
                    <Link href={`/clubs/${clubId}/players/${partner.id}`} className="truncate hover:text-primary">
                      {partner.name}
                    </Link>
                    <span className="shrink-0 text-sm font-normal text-muted-foreground">
                      <span className="figure text-xl text-foreground">{formatPercent(pair.winRate)}</span> em{" "}
                      {pair.games} jogos
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function PlayerProfilePage({
  params,
}: PageProps<"/clubs/[clubId]/players/[playerId]">) {
  const { clubId, playerId } = await params;
  const { club, player } = await loadPlayer(clubId, playerId);

  const [squad, history, clubMatches, clubStats] = await Promise.all([
    listPlayersByClub(club.id),
    listPlayerMatchHistory(player.id),
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  const summary = summarizePlayerHistory(history);
  const form = computeForm(
    history.flatMap((entry) => (entry.stats.rating === null ? [] : [entry.stats.rating])),
    player.stats.averageRating,
  );
  const splits = splitByPosition(history);
  const impact = computeImpact(clubMatches, clubStats, squad).find((candidate) => candidate.playerId === player.id);
  const scouting = scoutPlayer(squad, player);
  const scouted = scouting.some((metric) => metric.percentile !== null);
  const rank = (value: (candidate: Player) => number | null) => rankInSquad(squad, player, value);
  const { links } = computeAssistLinks(clubMatches, clubStats);
  const partners = computePairs(clubMatches, clubStats)
    .filter((pair) => pair.games >= MIN_PARTNER_GAMES)
    .filter((pair) => pair.first.id === player.id || pair.second.id === player.id)
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
    .slice(0, 3);
  const { stats } = player;

  const ranks = {
    games: rank((p) => p.stats.gamesPlayed),
    goals: rank((p) => p.stats.goals),
    assists: rank((p) => p.stats.assists),
    goalsAndAssists: rank(goalsAndAssists),
    rating: rank((p) => p.stats.averageRating),
    passing: rank((p) => p.stats.passSuccessRate),
    tackles: rank((p) => p.stats.tacklesMade),
    mvps: rank((p) => p.stats.manOfTheMatch),
  };
  const isFirst = (value: SquadRank | null) => value?.position === 1;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <BackLink href={`/clubs/${club.id}/players`}>Jogadores</BackLink>
        <PlayerHero
          club={club}
          player={player}
          accolades={{
            topScorer: isFirst(ranks.goals) && stats.goals > 0,
            topAssister: isFirst(ranks.assists) && stats.assists > 0,
            topMvp: isFirst(ranks.mvps) && stats.manOfTheMatch > 0,
          }}
          form={form}
        />
      </div>

      <section>
        <SectionHeading
          title="Temporada"
          action={<span className="text-sm text-muted-foreground">no clube · EA · posição no elenco</span>}
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <StatCard label="Jogos" value={formatInteger(stats.gamesPlayed)} badge={rankBadge(ranks.games)} />
          <StatCard label="Gols" value={formatInteger(stats.goals)} badge={rankBadge(ranks.goals)} />
          <StatCard label="Assist." value={formatInteger(stats.assists)} badge={rankBadge(ranks.assists)} />
          <StatCard
            label="G+A"
            value={formatInteger(goalsAndAssists(player))}
            badge={rankBadge(ranks.goalsAndAssists)}
          />
          <StatCard label="Nota média" value={formatRating(stats.averageRating)} badge={rankBadge(ranks.rating)} />
          <StatCard label="% passe" value={formatPercent(stats.passSuccessRate)} badge={rankBadge(ranks.passing)} />
          <StatCard label="Desarmes" value={formatInteger(stats.tacklesMade)} badge={rankBadge(ranks.tackles)} />
          <StatCard label="MVPs" value={formatInteger(stats.manOfTheMatch)} badge={rankBadge(ranks.mvps)} />
        </div>
      </section>

      {scouted && (
        <section>
          <SectionHeading
            title="Raio-X"
            description={`Por jogo na temporada, comparado com o elenco (membros com ${MIN_SCOUT_GAMES}+ jogos). Barra = percentil.`}
          />
          <ScoutReport metrics={scouting} />
        </section>
      )}

      <section className="space-y-4">
        <SectionHeading
          title="No histórico salvo"
          description={
            summary.firstPlayedAt
              ? `${summary.matches} partidas salvas desde ${formatDateTime(summary.firstPlayedAt)}`
              : "Partidas salvas a cada sincronização"
          }
        />

        {history.length === 0 ? (
          <EmptyState
            icon={CalendarXIcon}
            title="Nenhuma partida salva com este jogador"
            description="As partidas entram no histórico a cada sincronização com a EA."
          />
        ) : (
          <>
            <HistoryHighlights summary={summary} />
            {form && <FormCard form={form} />}
            {impact && <ImpactCard impact={impact} />}

            <div className="border bg-card p-4 sm:p-5">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-bold tracking-[0.06em] uppercase">Nota por partida</h3>
                <p className="text-xs text-muted-foreground">
                  últimas {Math.min(CHART_MATCHES, history.length)} · linha = média
                </p>
              </div>
              <RatingChart history={history} average={summary.averageRating} />
            </div>

            {summary.bestMatch && <BestMatch entry={summary.bestMatch} />}
          </>
        )}
      </section>

      {splits.length > 0 && (
        <section>
          <SectionHeading
            title="Por posição"
            description="Nas partidas salvas. A EA informa só o setor: gol, defesa, meio-campo ou ataque."
          />
          <PositionSplits splits={splits} />
        </section>
      )}

      {history.length > 0 && (
        <Partnerships
          clubId={club.id}
          player={player}
          received={links.filter((link) => link.toId === player.id)}
          given={links.filter((link) => link.fromId === player.id)}
          partners={partners}
        />
      )}

      {history.length > 0 && (
        <section>
          <SectionHeading
            title="Partidas"
            action={
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <StarIcon className="size-3 fill-amber-400 text-amber-400" aria-hidden /> = MVP
              </span>
            }
          />
          <PlayerMatchLog entries={history} />
        </section>
      )}
    </div>
  );
}
