import type { ClubPlayerMatchStat, GoalTypes, Match } from "@/types/match";

/**
 * Pré-assistências, interceptações e tipos de gol vêm dos contadores de eventos
 * da EA, que o site só passou a ler em 26/10/2026 (com as partidas que a EA ainda
 * guardava). Partidas anteriores têm esses valores em null e ficam fora das somas.
 */

export const GOAL_TYPE_KEYS = ["weakFoot", "chipped", "firstTime", "offPost"] as const satisfies (keyof GoalTypes)[];

export const GOAL_TYPE_LABELS: Record<keyof GoalTypes, { label: string; detail: string }> = {
  weakFoot: { label: "Pé fraco", detail: "com o pé que ele menos usa" },
  chipped: { label: "Cobertura", detail: "por cima do goleiro" },
  firstTime: { label: "De primeira", detail: "sem dominar a bola" },
  offPost: { label: "Na trave", detail: "bateu na trave e entrou" },
};

export interface TrackedEventLine {
  playerId: string;
  playerName: string;
  /** Partidas dele com os contadores. */
  games: number;
  secondAssists: number;
  interceptions: number;
  /** Gols nessas partidas e quantos foram de cada tipo. */
  goals: number;
  goalTypes: GoalTypes;
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
      goals: 0,
      goalTypes: { firstTime: 0, weakFoot: 0, chipped: 0, offPost: 0 },
    };
    line.games++;
    line.secondAssists += secondAssists ?? 0;
    line.interceptions += interceptions ?? 0;
    line.goals += stat.stats.goals;
    for (const key of GOAL_TYPE_KEYS) line.goalTypes[key] += stat.stats.goalTypes?.[key] ?? 0;
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
