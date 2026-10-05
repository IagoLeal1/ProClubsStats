import type { ClubPlayerMatchStat, Match } from "@/types/match";

/**
 * Uma "noite" (sessão de jogo): partidas seguidas com no máximo este intervalo
 * entre o início de uma e o da próxima. Cobre pausas e virada da meia-noite.
 */
export const SESSION_GAP_MS = 3 * 60 * 60 * 1000;

export interface SessionRecord {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface GameSession {
  /** Id da primeira partida — estável enquanto a sessão cresce. */
  id: string;
  /** Ordem cronológica. */
  matches: Match[];
  startedAt: string;
  endedAt: string;
  record: SessionRecord;
}

function sessionRecord(matches: Match[]): SessionRecord {
  return {
    wins: matches.filter((match) => match.result === "W").length,
    draws: matches.filter((match) => match.result === "D").length,
    losses: matches.filter((match) => match.result === "L").length,
    goalsFor: matches.reduce((total, match) => total + match.goalsFor, 0),
    goalsAgainst: matches.reduce((total, match) => total + match.goalsAgainst, 0),
  };
}

function toSession(matches: Match[]): GameSession {
  return {
    id: matches[0].id,
    matches,
    startedAt: matches[0].playedAt,
    endedAt: matches[matches.length - 1].playedAt,
    record: sessionRecord(matches),
  };
}

/** Agrupa partidas (em ordem cronológica) em sessões, também em ordem cronológica. */
export function groupSessions(matches: Match[]): GameSession[] {
  const sessions: GameSession[] = [];
  let current: Match[] = [];

  for (const match of matches) {
    const previous = current.at(-1);
    const gap = previous ? Date.parse(match.playedAt) - Date.parse(previous.playedAt) : 0;
    if (previous && gap > SESSION_GAP_MS) {
      sessions.push(toSession(current));
      current = [];
    }
    current.push(match);
  }
  if (current.length > 0) sessions.push(toSession(current));
  return sessions;
}

// -----------------------------------------------------------------------------
// Resumo de uma sessão
// -----------------------------------------------------------------------------

export interface SessionPlayerLine {
  playerId: string;
  playerName: string;
  games: number;
  goals: number;
  assists: number;
  mvps: number;
  averageRating: number | null;
}

export interface SessionSummary {
  players: SessionPlayerLine[];
  mvp: SessionPlayerLine | null;
  topScorer: SessionPlayerLine | null;
  topAssister: SessionPlayerLine | null;
  bestRating: SessionPlayerLine | null;
  worstRating: SessionPlayerLine | null;
}

function pickTop(
  lines: SessionPlayerLine[],
  compare: (a: SessionPlayerLine, b: SessionPlayerLine) => number,
  eligible: (line: SessionPlayerLine) => boolean = () => true,
): SessionPlayerLine | null {
  return [...lines].filter(eligible).sort(compare)[0] ?? null;
}

const byRating = (a: SessionPlayerLine, b: SessionPlayerLine) =>
  (b.averageRating ?? 0) - (a.averageRating ?? 0);

export function summarizeSession(session: GameSession, stats: ClubPlayerMatchStat[]): SessionSummary {
  const matchIds = new Set(session.matches.map((match) => match.id));
  const lines = new Map<string, SessionPlayerLine & { ratings: number[] }>();

  for (const stat of stats) {
    if (!matchIds.has(stat.matchId)) continue;
    const line = lines.get(stat.playerId) ?? {
      playerId: stat.playerId,
      playerName: stat.playerName,
      games: 0,
      goals: 0,
      assists: 0,
      mvps: 0,
      averageRating: null,
      ratings: [],
    };
    line.games++;
    line.goals += stat.stats.goals;
    line.assists += stat.stats.assists;
    if (stat.stats.manOfTheMatch) line.mvps++;
    if (stat.stats.rating !== null) line.ratings.push(stat.stats.rating);
    lines.set(stat.playerId, line);
  }

  const players: SessionPlayerLine[] = [...lines.values()]
    .map(({ ratings, ...line }) => ({
      ...line,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    }))
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || byRating(a, b));

  // Notas médias só valem para quem jogou ao menos metade da noite.
  const minGames = Math.ceil(session.matches.length / 2);
  const regular = (line: SessionPlayerLine) => line.games >= minGames && line.averageRating !== null;

  return {
    players,
    mvp: pickTop(players, (a, b) => b.mvps - a.mvps || byRating(a, b), regular) ?? pickTop(players, byRating),
    topScorer: pickTop(players, (a, b) => b.goals - a.goals || a.games - b.games, (line) => line.goals > 0),
    topAssister: pickTop(
      players,
      (a, b) => b.assists - a.assists || a.games - b.games,
      (line) => line.assists > 0,
    ),
    bestRating: pickTop(players, byRating, regular),
    worstRating: pickTop(players, (a, b) => byRating(b, a), regular),
  };
}
