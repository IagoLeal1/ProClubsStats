import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeftIcon, CalendarXIcon, StarIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchResult } from "@/components/matches/MatchResult";
import { PlayerMatchLog } from "@/components/players/PlayerMatchLog";
import { PlayerRatingChart, type RatingPoint } from "@/components/players/PlayerRatingChart";
import { RatingBadge } from "@/components/players/RatingBadge";
import { StatCard } from "@/components/stats/StatCard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listPlayerMatchHistory } from "@/lib/db/matches.repository";
import { getPlayerById, listPlayersByClub } from "@/lib/db/players.repository";
import {
  formatDateTime,
  formatInteger,
  formatPercent,
  formatPositionGroupShort,
  formatRating,
} from "@/lib/format";
import { rankInSquad, summarizePlayerHistory, type SquadRank } from "@/lib/stats/player-history";
import { goalsAndAssists } from "@/lib/stats/player-stats";
import type { PlayerMatchEntry } from "@/types/match";
import type { Player } from "@/types/player";

import { isValidId, loadClub } from "../../load-club";

/** Quantas partidas aparecem no gráfico de notas. */
const CHART_MATCHES = 20;

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

const rankHint = (rank: SquadRank | null) =>
  rank ? `${rank.position}º de ${rank.total} no elenco` : undefined;

/** Eixo X do gráfico: dia e hora, porque várias partidas costumam ser no mesmo dia. */
const axisDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function toRatingPoints(entries: PlayerMatchEntry[]): RatingPoint[] {
  return entries
    .filter((entry) => entry.stats.rating !== null)
    .slice(0, CHART_MATCHES)
    .reverse()
    .map(({ match, stats }) => ({
      href: `/clubs/${match.clubId}/matches/${match.id}`,
      rating: stats.rating ?? 0,
      opponent: match.opponent.name,
      dateLabel: formatDateTime(match.playedAt),
      axisLabel: axisDate.format(new Date(match.playedAt)),
      score: `${match.goalsFor}–${match.goalsAgainst}`,
      result: match.result,
      goals: stats.goals,
      assists: stats.assists,
    }));
}

function PlayerHeader({ player }: { player: Player }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-2xl font-semibold tracking-tight">{player.name}</h2>
        <p className="text-sm text-muted-foreground">
          {player.proName ?? "—"}
          {player.position && ` · ${player.position}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {!player.isMember && <Badge variant="outline">ex-membro</Badge>}
        {player.favoritePosition && (
          <Badge variant="secondary">{formatPositionGroupShort(player.favoritePosition)}</Badge>
        )}
        {player.overall !== null && (
          <Badge variant="secondary" className="tabular">
            {player.overall} OVR
          </Badge>
        )}
      </div>
    </div>
  );
}

function BestMatch({ entry }: { entry: PlayerMatchEntry }) {
  const { match, stats } = entry;
  return (
    <Link
      href={`/clubs/${match.clubId}/matches/${match.id}`}
      className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent"
    >
      <RatingBadge rating={stats.rating} className="px-2 py-1 text-sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">Melhor partida salva</p>
        <p className="truncate font-medium">vs {match.opponent.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(match.playedAt)} · {stats.goals} G · {stats.assists} A
        </p>
      </div>
      <span className="flex items-center gap-1.5 font-semibold tabular">
        <MatchResult result={match.result} size="sm" />
        {match.goalsFor}–{match.goalsAgainst}
      </span>
    </Link>
  );
}

export default async function PlayerProfilePage({
  params,
}: PageProps<"/clubs/[clubId]/players/[playerId]">) {
  const { clubId, playerId } = await params;
  const { club, player } = await loadPlayer(clubId, playerId);

  const [squad, history] = await Promise.all([
    listPlayersByClub(club.id),
    listPlayerMatchHistory(player.id),
  ]);
  const summary = summarizePlayerHistory(history);
  const rank = (value: (candidate: Player) => number | null) => rankInSquad(squad, player, value);
  const { stats } = player;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Link
          href={`/clubs/${club.id}/players`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
        >
          <ArrowLeftIcon data-icon="inline-start" /> Jogadores
        </Link>
        <PlayerHeader player={player} />
      </div>

      <section>
        <SectionHeading title="Temporada" description="Estatísticas no clube registradas pela EA" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Jogos"
            value={formatInteger(stats.gamesPlayed)}
            hint={rankHint(rank((p) => p.stats.gamesPlayed))}
          />
          <StatCard
            label="Gols"
            value={formatInteger(stats.goals)}
            hint={rankHint(rank((p) => p.stats.goals))}
            tone="primary"
          />
          <StatCard
            label="Assistências"
            value={formatInteger(stats.assists)}
            hint={rankHint(rank((p) => p.stats.assists))}
          />
          <StatCard
            label="G+A"
            value={formatInteger(goalsAndAssists(player))}
            hint={rankHint(rank(goalsAndAssists))}
          />
          <StatCard
            label="Nota média"
            value={formatRating(stats.averageRating)}
            hint={rankHint(rank((p) => p.stats.averageRating))}
          />
          <StatCard
            label="% passes certos"
            value={formatPercent(stats.passSuccessRate)}
            hint={rankHint(rank((p) => p.stats.passSuccessRate))}
          />
          <StatCard
            label="Desarmes"
            value={formatInteger(stats.tacklesMade)}
            hint={rankHint(rank((p) => p.stats.tacklesMade))}
          />
          <StatCard
            label="MVPs"
            value={formatInteger(stats.manOfTheMatch)}
            hint={rankHint(rank((p) => p.stats.manOfTheMatch))}
          />
        </div>
      </section>

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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Vitórias com ele em campo"
                value={formatPercent(summary.winRate)}
                hint={`${summary.wins}V ${summary.draws}E ${summary.losses}D`}
              />
              <StatCard
                label="Nota média"
                value={formatRating(summary.averageRating)}
                hint={`em ${summary.matches} partidas`}
              />
              <StatCard
                label="Gols + assistências"
                value={`${summary.goals} + ${summary.assists}`}
                hint={`${summary.shots} chutes`}
              />
              <StatCard
                label="Precisão de passe"
                value={formatPercent(summary.passAccuracy)}
                hint={`${summary.tackles} desarmes · ${summary.manOfTheMatch} MVP`}
              />
            </div>

            <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-medium">Nota por partida</h3>
                <p className="text-xs text-muted-foreground">
                  últimas {Math.min(CHART_MATCHES, history.length)}
                </p>
              </div>
              <PlayerRatingChart points={toRatingPoints(history)} average={summary.averageRating} />
            </div>

            {summary.bestMatch && <BestMatch entry={summary.bestMatch} />}

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                Partidas
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <StarIcon className="size-3 fill-amber-400 text-amber-400" aria-hidden /> = MVP
                </span>
              </h3>
              <PlayerMatchLog entries={history} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
