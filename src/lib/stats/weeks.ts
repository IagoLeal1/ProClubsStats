import type { ClubPlayerMatchStat, Match } from "@/types/match";
import { POSITION_GROUPS, type PositionGroup } from "@/types/player";

import {
  byPerformance,
  groupByPeriod,
  localDate,
  minGamesFor,
  summarizePlayers,
  type GamePeriod,
  type PeriodPlayerLine,
} from "./periods";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_ID = /^\d{4}-\d{2}-\d{2}$/;

/** Data à meia-noite UTC → "AAAA-MM-DD". */
const toId = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Semana de jogo: segunda a domingo no horário de Brasília. O id é a data da
 * segunda-feira, ex.: "2026-09-28".
 */
export function weekIdOf(iso: string): string {
  const { year, month, day, weekday } = localDate(iso);
  return toId(new Date(Date.UTC(year, month - 1, day) - weekday * DAY_MS));
}

/** Só aceita datas reais que caem numa segunda-feira. */
export function isWeekId(value: string): boolean {
  if (!WEEK_ID.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && toId(date) === value && date.getUTCDay() === 1;
}

/** Ex.: "28/09 a 04/10". */
export function formatWeekRange(weekId: string): string {
  const start = new Date(`${weekId}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const short = (date: Date) => `${toId(date).slice(8, 10)}/${toId(date).slice(5, 7)}`;
  return `${short(start)} a ${short(end)}`;
}

export type GameWeek = GamePeriod;

/** Partidas (em ordem cronológica) agrupadas por semana. */
export function groupWeeks(matches: Match[]): GameWeek[] {
  return groupByPeriod(matches, weekIdOf);
}

// -----------------------------------------------------------------------------
// Time da semana
// -----------------------------------------------------------------------------

export type WeekPlayerLine = PeriodPlayerLine;

export interface TeamOfTheWeek {
  /** Em campo, do melhor para o pior. Aqui `position` é o setor em que foi escalado. */
  lineup: WeekPlayerLine[];
  /** Quem jogou mas ficou fora: poucos jogos ou setor já completo. */
  bench: WeekPlayerLine[];
  /** Melhor nota entre os titulares. */
  star: WeekPlayerLine | null;
  /** Mínimo de jogos na semana para ser titular. */
  minGames: number;
}

/** Vagas por setor, como num 4-3-3. A EA só informa o setor de cada jogador. */
export const LINE_SLOTS: Record<PositionGroup, number> = {
  goalkeeper: 1,
  defender: 4,
  midfielder: 3,
  forward: 3,
};

/**
 * Setor lotado: o jogador vai para o vizinho com vaga, como um técnico faria
 * (a EA marca quase todo mundo como meio-campo). Goleiro não muda de setor.
 */
const NEIGHBOR_SECTORS: Record<PositionGroup, PositionGroup[]> = {
  goalkeeper: [],
  defender: ["midfielder"],
  midfielder: ["forward", "defender"],
  forward: ["midfielder"],
};

export function pickTeamOfTheWeek(week: GameWeek, stats: ClubPlayerMatchStat[]): TeamOfTheWeek {
  const lines = summarizePlayers(week.matches, stats).sort(byPerformance);
  const minGames = minGamesFor(week);
  const filled = Object.fromEntries(POSITION_GROUPS.map((group) => [group, 0])) as Record<PositionGroup, number>;
  const lineup: WeekPlayerLine[] = [];
  const bench: WeekPlayerLine[] = [];

  for (const line of lines) {
    const { position } = line;
    const sector =
      position !== null && line.averageRating !== null && line.games >= minGames
        ? [position, ...NEIGHBOR_SECTORS[position]].find((candidate) => filled[candidate] < LINE_SLOTS[candidate])
        : undefined;
    if (sector) {
      lineup.push({ ...line, position: sector });
      filled[sector]++;
    } else {
      bench.push(line);
    }
  }

  return { lineup, bench, star: lineup[0] ?? null, minGames };
}

/** Altura de cada setor no campo (0 = próprio gol, 100 = gol adversário). */
const LINE_Y: Record<PositionGroup, number> = { goalkeeper: 7, defender: 28, midfielder: 54, forward: 80 };

export interface LineupSpot {
  line: WeekPlayerLine;
  /** 0–100, esquerda → direita. */
  x: number;
  /** 0–100, próprio gol → gol adversário. */
  y: number;
}

/** Distribui os titulares no campo: cada setor numa linha, espaçados por igual. */
export function placeLineup(lineup: WeekPlayerLine[]): LineupSpot[] {
  return POSITION_GROUPS.flatMap((group) => {
    const row = lineup.filter((line) => line.position === group);
    return row.map((line, index) => ({ line, x: ((index + 1) * 100) / (row.length + 1), y: LINE_Y[group] }));
  });
}
