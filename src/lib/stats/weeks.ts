import type { ClubPlayerMatchStat, Match } from "@/types/match";
import { POSITION_GROUPS, type PositionGroup } from "@/types/player";

import { groupSessions, sessionRecord, type GameSession, type SessionRecord } from "./sessions";

const TIME_ZONE = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_ID = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const localDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

/** Data à meia-noite UTC → "AAAA-MM-DD". */
const toId = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Semana de jogo: segunda a domingo no horário de Brasília. O id é a data da
 * segunda-feira, ex.: "2026-09-28".
 */
export function weekIdOf(iso: string): string {
  const parts = Object.fromEntries(
    localDateParts.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  const localDay = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return toId(new Date(localDay - WEEKDAYS.indexOf(parts.weekday) * DAY_MS));
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

export interface GameWeek {
  id: string;
  /** Ordem cronológica. */
  sessions: GameSession[];
  matches: Match[];
  record: SessionRecord;
}

/**
 * Agrupa as partidas (em ordem cronológica) por semana. A noite inteira conta
 * na semana em que começou, mesmo se passar da meia-noite de domingo.
 */
export function groupWeeks(matches: Match[]): GameWeek[] {
  const weeks: Omit<GameWeek, "record">[] = [];
  for (const session of groupSessions(matches)) {
    const id = weekIdOf(session.startedAt);
    const current = weeks.at(-1);
    if (current?.id === id) {
      current.sessions.push(session);
      current.matches.push(...session.matches);
    } else {
      weeks.push({ id, sessions: [session], matches: [...session.matches] });
    }
  }
  return weeks.map((week) => ({ ...week, record: sessionRecord(week.matches) }));
}

// -----------------------------------------------------------------------------
// Time da semana
// -----------------------------------------------------------------------------

export interface WeekPlayerLine {
  playerId: string;
  playerName: string;
  games: number;
  goals: number;
  assists: number;
  mvps: number;
  averageRating: number | null;
  /** Setor em que mais jogou na semana (empate: o de melhor nota). */
  position: PositionGroup | null;
}

export interface TeamOfTheWeek {
  /** Em campo, do melhor para o pior. */
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

interface PositionTally {
  games: number;
  ratingSum: number;
  rated: number;
}

interface LineDraft extends Omit<WeekPlayerLine, "averageRating" | "position"> {
  ratings: number[];
  positions: Map<PositionGroup, PositionTally>;
}

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : null;

function mainPosition(positions: Map<PositionGroup, PositionTally>): PositionGroup | null {
  let best: { group: PositionGroup; tally: PositionTally } | null = null;
  for (const [group, tally] of positions) {
    const rating = tally.rated > 0 ? tally.ratingSum / tally.rated : 0;
    const bestRating = best && best.tally.rated > 0 ? best.tally.ratingSum / best.tally.rated : 0;
    if (!best || tally.games > best.tally.games || (tally.games === best.tally.games && rating > bestRating)) {
      best = { group, tally };
    }
  }
  return best?.group ?? null;
}

/** Nota; depois MVPs, G+A e jogos. */
const byPerformance = (a: WeekPlayerLine, b: WeekPlayerLine) =>
  (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
  b.mvps - a.mvps ||
  b.goals + b.assists - (a.goals + a.assists) ||
  b.games - a.games;

export function pickTeamOfTheWeek(week: GameWeek, stats: ClubPlayerMatchStat[]): TeamOfTheWeek {
  const matchIds = new Set(week.matches.map((match) => match.id));
  const drafts = new Map<string, LineDraft>();

  for (const stat of stats) {
    if (!matchIds.has(stat.matchId)) continue;
    const draft: LineDraft = drafts.get(stat.playerId) ?? {
      playerId: stat.playerId,
      playerName: stat.playerName,
      games: 0,
      goals: 0,
      assists: 0,
      mvps: 0,
      ratings: [],
      positions: new Map(),
    };
    const { rating, position } = stat.stats;
    draft.games++;
    draft.goals += stat.stats.goals;
    draft.assists += stat.stats.assists;
    if (stat.stats.manOfTheMatch) draft.mvps++;
    if (rating !== null) draft.ratings.push(rating);
    if (position) {
      const tally = draft.positions.get(position) ?? { games: 0, ratingSum: 0, rated: 0 };
      tally.games++;
      if (rating !== null) {
        tally.ratingSum += rating;
        tally.rated++;
      }
      draft.positions.set(position, tally);
    }
    drafts.set(stat.playerId, draft);
  }

  const lines = [...drafts.values()]
    .map(({ ratings, positions, ...line }) => ({
      ...line,
      averageRating: average(ratings),
      position: mainPosition(positions),
    }))
    .sort(byPerformance);

  // Titular precisa ter jogado ao menos um terço das partidas da semana.
  const minGames = Math.max(1, Math.ceil(week.matches.length / 3));
  const filled = Object.fromEntries(POSITION_GROUPS.map((group) => [group, 0])) as Record<PositionGroup, number>;
  const lineup: WeekPlayerLine[] = [];
  const bench: WeekPlayerLine[] = [];

  for (const line of lines) {
    const { position } = line;
    if (
      position !== null &&
      line.averageRating !== null &&
      line.games >= minGames &&
      filled[position] < LINE_SLOTS[position]
    ) {
      lineup.push(line);
      filled[position]++;
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
