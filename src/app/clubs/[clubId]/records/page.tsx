import type { Metadata } from "next";
import { TrophyIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { AssistLinks } from "@/components/records/AssistLinks";
import { PairsTable } from "@/components/records/PairsTable";
import { PerformanceList } from "@/components/records/PerformanceList";
import { RecordCard } from "@/components/records/RecordCard";
import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { formatDateTime, formatInteger, formatRating } from "@/lib/format";
import { computeAssistLinks, computePairs } from "@/lib/stats/partnerships";
import {
  computeClubRecords,
  countHatTricks,
  topPerformances,
  type StreakRecord,
} from "@/lib/stats/records";
import type { Match, MatchResult } from "@/types/match";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Recordes" };

/** Mínimo de jogos juntos para uma dupla entrar na tabela. */
const MIN_PAIR_GAMES = 3;

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

const STREAK_LABELS: Record<MatchResult, [string, string]> = {
  W: ["vitória", "vitórias"],
  D: ["empate", "empates"],
  L: ["derrota", "derrotas"],
};

const score = (match: Match) => `${match.goalsFor}–${match.goalsAgainst}`;
const against = (match: Match) => `vs ${match.opponent.name} · ${formatDateTime(match.playedAt)}`;

function streakDetail(streak: StreakRecord): string {
  const from = shortDate.format(new Date(streak.first.playedAt));
  const to = shortDate.format(new Date(streak.last.playedAt));
  return from === to ? `em ${from}` : `de ${from} a ${to}`;
}

const plural = (count: number, [one, many]: [string, string]) => `${count} ${count === 1 ? one : many}`;

export default async function ClubRecordsPage({ params }: PageProps<"/clubs/[clubId]/records">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const [matches, stats] = await Promise.all([
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={TrophyIcon}
        title="Sem partidas salvas ainda"
        description="Os recordes são calculados a partir do histórico que o site salva a cada sincronização."
      />
    );
  }

  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const records = computeClubRecords(matches);
  const assistLinks = computeAssistLinks(matches, stats);
  const pairs = computePairs(matches, stats)
    .filter((pair) => pair.games >= MIN_PAIR_GAMES)
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games || b.goalContributions - a.goalContributions)
    .slice(0, 10);
  const hatTricks = countHatTricks(stats);
  const matchHref = (match: Match) => `/clubs/${club.id}/matches/${match.id}`;

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        Calculados a partir de {formatInteger(matches.length)} partidas salvas desde{" "}
        {formatDateTime(matches[0].playedAt)} (liga, playoffs e amistosos).
      </p>

      <section>
        <SectionHeading title="Recordes do clube" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {records.biggestWin && (
            <RecordCard
              label="Maior goleada"
              value={score(records.biggestWin)}
              detail={against(records.biggestWin)}
              href={matchHref(records.biggestWin)}
              tone="win"
            />
          )}
          {records.worstLoss && (
            <RecordCard
              label="Pior derrota"
              value={score(records.worstLoss)}
              detail={against(records.worstLoss)}
              href={matchHref(records.worstLoss)}
              tone="loss"
            />
          )}
          {records.highestScoring && (
            <RecordCard
              label="Jogo com mais gols"
              value={score(records.highestScoring)}
              detail={against(records.highestScoring)}
              href={matchHref(records.highestScoring)}
            />
          )}
          {records.longestWinStreak && (
            <RecordCard
              label="Maior sequência de vitórias"
              value={plural(records.longestWinStreak.length, STREAK_LABELS.W)}
              detail={streakDetail(records.longestWinStreak)}
            />
          )}
          {records.longestUnbeatenStreak && (
            <RecordCard
              label="Maior invencibilidade"
              value={plural(records.longestUnbeatenStreak.length, ["jogo", "jogos"])}
              detail={streakDetail(records.longestUnbeatenStreak)}
            />
          )}
          {records.currentStreak && (
            <RecordCard
              label="Sequência atual"
              value={plural(records.currentStreak.length, STREAK_LABELS[records.currentStreak.result])}
              detail="nos últimos jogos salvos"
              tone={
                records.currentStreak.result === "W"
                  ? "win"
                  : records.currentStreak.result === "L"
                    ? "loss"
                    : "default"
              }
            />
          )}
        </div>
      </section>

      <section>
        <SectionHeading title="Recordes individuais" description="Melhores atuações numa única partida" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PerformanceList
            clubId={club.id}
            title="Mais gols"
            records={topPerformances(stats, matchesById, (stat) => stat.stats.goals)}
            formatValue={formatInteger}
          />
          <PerformanceList
            clubId={club.id}
            title="Mais assistências"
            records={topPerformances(stats, matchesById, (stat) => stat.stats.assists)}
            formatValue={formatInteger}
          />
          <PerformanceList
            clubId={club.id}
            title="Maior nota"
            records={topPerformances(stats, matchesById, (stat) => stat.stats.rating)}
            formatValue={formatRating}
          />
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-xs font-medium text-muted-foreground">Hat-tricks (3+ gols)</p>
            {hatTricks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum hat-trick ainda.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {hatTricks.map((entry) => (
                  <li key={entry.playerId} className="flex justify-between gap-3">
                    <span className="truncate font-medium">{entry.playerName}</span>
                    <span className="font-semibold tabular">{entry.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading title="Duplas" />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Conexões de gol</h3>
              <p className="text-xs text-muted-foreground">
                Quem deu assistência para quem. A EA não informa lance a lance, então contamos só o
                que dá para garantir pelos números de cada partida —{" "}
                {assistLinks.confirmedAssists} de {assistLinks.totalAssists} assistências confirmadas.
              </p>
            </div>
            <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <AssistLinks clubId={club.id} links={assistLinks.links} />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Juntos em campo</h3>
              <p className="text-xs text-muted-foreground">
                Campanha do clube com os dois jogando ({MIN_PAIR_GAMES}+ jogos juntos).
              </p>
            </div>
            {pairs.length > 0 ? (
              <PairsTable clubId={club.id} pairs={pairs} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não há duplas com {MIN_PAIR_GAMES} jogos juntos.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
