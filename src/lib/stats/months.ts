import type { ClubPlayerMatchStat, Match } from "@/types/match";

import {
  byPerformance,
  groupByPeriod,
  localDate,
  minGamesFor,
  summarizePlayers,
  type GamePeriod,
  type PeriodPlayerLine,
} from "./periods";

const MONTH_ID = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Mês no horário de Brasília, ex.: "2026-10". */
export function monthIdOf(iso: string): string {
  const { year, month } = localDate(iso);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isMonthId(value: string): boolean {
  return MONTH_ID.test(value);
}

/** Ex.: "outubro de 2026". */
export function formatMonth(monthId: string): string {
  const [, year, month] = MONTH_ID.exec(monthId) ?? [];
  return year ? `${MONTH_NAMES[Number(month) - 1]} de ${year}` : monthId;
}

export type GameMonth = GamePeriod;

/** Partidas (em ordem cronológica) agrupadas por mês. */
export function groupMonths(matches: Match[]): GameMonth[] {
  return groupByPeriod(matches, monthIdOf);
}

export interface MonthAwards {
  /** Melhor nota média entre quem jogou ao menos um terço do mês. */
  goldenBall: PeriodPlayerLine | null;
  topScorer: PeriodPlayerLine | null;
  topAssister: PeriodPlayerLine | null;
  /** Mais desarmes. */
  wall: PeriodPlayerLine | null;
  /** Pior nota média entre os mesmos elegíveis da Bola de Ouro. */
  flop: PeriodPlayerLine | null;
  minGames: number;
  /** Todos que jogaram no mês, do melhor para o pior. */
  players: PeriodPlayerLine[];
}

/** Quem mais tem de um número; empate fica com quem jogou menos. */
function mostOf(lines: PeriodPlayerLine[], value: (line: PeriodPlayerLine) => number): PeriodPlayerLine | null {
  return (
    [...lines].filter((line) => value(line) > 0).sort((a, b) => value(b) - value(a) || a.games - b.games)[0] ??
    null
  );
}

export function pickMonthAwards(month: GameMonth, stats: ClubPlayerMatchStat[]): MonthAwards {
  const players = summarizePlayers(month.matches, stats).sort(byPerformance);
  const minGames = minGamesFor(month);
  const eligible = players.filter((line) => line.games >= minGames && line.averageRating !== null);
  const goldenBall = eligible[0] ?? null;
  // O bagre só existe se houver mais de um elegível (senão seria o próprio Bola de Ouro).
  const flop = eligible.length > 1 ? eligible[eligible.length - 1] : null;

  return {
    goldenBall,
    topScorer: mostOf(players, (line) => line.goals),
    topAssister: mostOf(players, (line) => line.assists),
    wall: mostOf(players, (line) => line.tackles),
    flop,
    minGames,
    players,
  };
}
