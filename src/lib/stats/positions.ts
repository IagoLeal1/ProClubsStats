import type { ClubPlayerMatchStat, PlayerMatchEntry } from "@/types/match";
import { POSITION_GROUPS, type PositionGroup } from "@/types/player";

/** Mínimo de jogos num setor para comparar a nota com a dos outros setores. */
export const MIN_POSITION_GAMES = 2;

export interface PositionSplit {
  position: PositionGroup;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  averageRating: number | null;
  /** % de vitórias jogando no setor (0–100). */
  winRate: number;
}

/**
 * Desempenho de um jogador por setor (a EA informa só GOL, DEF, MEI ou ATA em
 * cada partida). Ordem: goleiro → ataque; setores sem jogos ficam de fora.
 */
export function splitByPosition(entries: PlayerMatchEntry[]): PositionSplit[] {
  return POSITION_GROUPS.flatMap((position) => {
    const played = entries.filter((entry) => entry.stats.position === position);
    if (played.length === 0) return [];
    const ratings = played.flatMap((entry) => (entry.stats.rating === null ? [] : [entry.stats.rating]));
    const wins = played.filter((entry) => entry.match.result === "W").length;
    return [
      {
        position,
        games: played.length,
        wins,
        draws: played.filter((entry) => entry.match.result === "D").length,
        losses: played.filter((entry) => entry.match.result === "L").length,
        goals: played.reduce((total, entry) => total + entry.stats.goals, 0),
        assists: played.reduce((total, entry) => total + entry.stats.assists, 0),
        averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
        winRate: (wins / played.length) * 100,
      },
    ];
  });
}

/**
 * Setor de melhor nota, quando há pelo menos dois setores com jogos
 * suficientes para comparar.
 */
export function bestPosition(splits: PositionSplit[]): PositionGroup | null {
  const comparable = splits.filter(
    (split) => split.games >= MIN_POSITION_GAMES && split.averageRating !== null,
  );
  if (comparable.length < 2) return null;
  return comparable.reduce((best, split) =>
    (split.averageRating ?? 0) > (best.averageRating ?? 0) ? split : best,
  ).position;
}

export interface PositionRating {
  games: number;
  averageRating: number;
}

export type PositionRatings = Partial<Record<PositionGroup, PositionRating>>;

/** Nota média de cada jogador em cada setor, para o montador de formação. */
export function ratingsByPosition(stats: ClubPlayerMatchStat[]): Map<string, PositionRatings> {
  const sums = new Map<string, Partial<Record<PositionGroup, { games: number; total: number }>>>();
  for (const { playerId, stats: values } of stats) {
    if (!values.position || values.rating === null) continue;
    const player = sums.get(playerId) ?? {};
    const sum = player[values.position] ?? { games: 0, total: 0 };
    sum.games++;
    sum.total += values.rating;
    player[values.position] = sum;
    sums.set(playerId, player);
  }

  const result = new Map<string, PositionRatings>();
  for (const [playerId, byPosition] of sums) {
    const ratings: PositionRatings = {};
    for (const group of POSITION_GROUPS) {
      const sum = byPosition[group];
      if (sum) ratings[group] = { games: sum.games, averageRating: sum.total / sum.games };
    }
    result.set(playerId, ratings);
  }
  return result;
}
