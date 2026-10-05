import type { ClubMetrics, ClubRecord } from "@/types/club";

const ratio = (value: number, total: number) => (total > 0 ? value / total : null);

export function gamesInRecord(record: ClubRecord): number {
  return record.gamesPlayed || record.wins + record.draws + record.losses;
}

/** Métricas derivadas do recorde. Taxas em porcentagem (0–100). */
export function computeClubMetrics(record: ClubRecord): ClubMetrics {
  const games = gamesInRecord(record);
  const winRatio = ratio(record.wins, games);
  const pointsRatio = ratio(record.wins * 3 + record.draws, games * 3);

  return {
    winRate: winRatio === null ? null : winRatio * 100,
    pointsRate: pointsRatio === null ? null : pointsRatio * 100,
    goalDifference: record.goalsFor - record.goalsAgainst,
    goalsPerGame: ratio(record.goalsFor, games),
    goalsAgainstPerGame: ratio(record.goalsAgainst, games),
  };
}
