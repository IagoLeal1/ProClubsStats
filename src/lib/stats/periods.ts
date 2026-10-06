import type { ClubPlayerMatchStat, Match } from "@/types/match";
import type { PositionGroup } from "@/types/player";

import { groupSessions, sessionRecord, type GameSession, type SessionRecord } from "./sessions";

const TIME_ZONE = "America/Sao_Paulo";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const localDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

export interface LocalDate {
  year: number;
  /** 1–12. */
  month: number;
  day: number;
  /** 0 = segunda … 6 = domingo. */
  weekday: number;
}

/** Data no horário de Brasília de um instante ISO. */
export function localDate(iso: string): LocalDate {
  const parts = Object.fromEntries(
    localDateParts.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Semana, mês…: as noites de jogo que caem num mesmo período. */
export interface GamePeriod {
  id: string;
  /** Ordem cronológica. */
  sessions: GameSession[];
  matches: Match[];
  record: SessionRecord;
}

/**
 * Agrupa as partidas (em ordem cronológica) por período. A noite inteira
 * conta no período em que começou, mesmo se passar da meia-noite.
 */
export function groupByPeriod(matches: Match[], periodOf: (iso: string) => string): GamePeriod[] {
  const periods: Omit<GamePeriod, "record">[] = [];
  for (const session of groupSessions(matches)) {
    const id = periodOf(session.startedAt);
    const current = periods.at(-1);
    if (current?.id === id) {
      current.sessions.push(session);
      current.matches.push(...session.matches);
    } else {
      periods.push({ id, sessions: [session], matches: [...session.matches] });
    }
  }
  return periods.map((period) => ({ ...period, record: sessionRecord(period.matches) }));
}

/** Números de um jogador num período. */
export interface PeriodPlayerLine {
  playerId: string;
  playerName: string;
  games: number;
  goals: number;
  assists: number;
  tackles: number;
  mvps: number;
  averageRating: number | null;
  /** Setor em que mais jogou no período (empate: o de melhor nota). */
  position: PositionGroup | null;
}

interface PositionTally {
  games: number;
  ratingSum: number;
  rated: number;
}

interface LineDraft extends Omit<PeriodPlayerLine, "averageRating" | "position"> {
  ratings: number[];
  positions: Map<PositionGroup, PositionTally>;
}

const tallyRating = (tally: PositionTally) => (tally.rated > 0 ? tally.ratingSum / tally.rated : 0);

function mainPosition(positions: Map<PositionGroup, PositionTally>): PositionGroup | null {
  let best: { group: PositionGroup; tally: PositionTally } | null = null;
  for (const [group, tally] of positions) {
    if (
      !best ||
      tally.games > best.tally.games ||
      (tally.games === best.tally.games && tallyRating(tally) > tallyRating(best.tally))
    ) {
      best = { group, tally };
    }
  }
  return best?.group ?? null;
}

/** Soma os números de cada jogador nas partidas do período. */
export function summarizePlayers(matches: Match[], stats: ClubPlayerMatchStat[]): PeriodPlayerLine[] {
  const matchIds = new Set(matches.map((match) => match.id));
  const drafts = new Map<string, LineDraft>();

  for (const stat of stats) {
    if (!matchIds.has(stat.matchId)) continue;
    const draft: LineDraft = drafts.get(stat.playerId) ?? {
      playerId: stat.playerId,
      playerName: stat.playerName,
      games: 0,
      goals: 0,
      assists: 0,
      tackles: 0,
      mvps: 0,
      ratings: [],
      positions: new Map(),
    };
    const { rating, position } = stat.stats;
    draft.games++;
    draft.goals += stat.stats.goals;
    draft.assists += stat.stats.assists;
    draft.tackles += stat.stats.tackles;
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

  return [...drafts.values()].map(({ ratings, positions, ...line }) => ({
    ...line,
    averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    position: mainPosition(positions),
  }));
}

/** Nota; depois MVPs, G+A e jogos. */
export const byPerformance = (a: PeriodPlayerLine, b: PeriodPlayerLine) =>
  (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
  b.mvps - a.mvps ||
  b.goals + b.assists - (a.goals + a.assists) ||
  b.games - a.games;

/** Para destaques de período: precisa ter jogado ao menos um terço das partidas. */
export const minGamesFor = (period: GamePeriod) => Math.max(1, Math.ceil(period.matches.length / 3));
