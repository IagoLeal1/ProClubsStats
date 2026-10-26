import type { ClubPlayerMatchStat, Match } from "@/types/match";

/**
 * Pré-assistências e interceptações vêm dos contadores de eventos da EA, que o
 * site só passou a ler em 26/10/2026 (com as partidas que a EA ainda guardava).
 * Partidas anteriores têm esses valores em null e ficam fora das somas.
 */

export interface TrackedEventLine {
  playerId: string;
  playerName: string;
  /** Partidas dele com os contadores. */
  games: number;
  secondAssists: number;
  interceptions: number;
}

export function summarizeTrackedEvents(stats: ClubPlayerMatchStat[]): TrackedEventLine[] {
  const lines = new Map<string, TrackedEventLine>();
  for (const stat of stats) {
    const { secondAssists, interceptions } = stat.stats;
    if (secondAssists === null && interceptions === null) continue;
    const line = lines.get(stat.playerId) ?? {
      playerId: stat.playerId,
      playerName: stat.playerName,
      games: 0,
      secondAssists: 0,
      interceptions: 0,
    };
    line.games++;
    line.secondAssists += secondAssists ?? 0;
    line.interceptions += interceptions ?? 0;
    lines.set(stat.playerId, line);
  }
  return [...lines.values()];
}

/** Posição no clube (1 = mais); empates dividem a posição. Null se ele não tem o dado. */
export function trackedRank(
  lines: TrackedEventLine[],
  playerId: string,
  value: (line: TrackedEventLine) => number,
): number | null {
  const own = lines.find((line) => line.playerId === playerId);
  if (!own) return null;
  return lines.filter((line) => value(line) > value(own)).length + 1;
}

/** Data da primeira partida com os contadores (as partidas vêm em ordem cronológica). */
export function firstTrackedMatch(matches: Match[], stats: ClubPlayerMatchStat[]): string | null {
  const tracked = new Set(stats.filter((stat) => stat.stats.secondAssists !== null).map((stat) => stat.matchId));
  return matches.find((match) => tracked.has(match.id))?.playedAt ?? null;
}
