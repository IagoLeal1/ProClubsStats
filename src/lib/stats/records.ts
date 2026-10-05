import type { ClubPlayerMatchStat, Match, MatchResult } from "@/types/match";

// -----------------------------------------------------------------------------
// Recordes do clube (a partir das partidas salvas)
// -----------------------------------------------------------------------------

export interface StreakRecord {
  length: number;
  first: Match;
  last: Match;
}

export interface ClubRecords {
  biggestWin: Match | null;
  worstLoss: Match | null;
  highestScoring: Match | null;
  longestWinStreak: StreakRecord | null;
  longestUnbeatenStreak: StreakRecord | null;
  currentStreak: { result: MatchResult; length: number } | null;
}

const margin = (match: Match) => match.goalsFor - match.goalsAgainst;
const totalGoals = (match: Match) => match.goalsFor + match.goalsAgainst;

/** Maior valor; no empate, a partida mais antiga (o recorde foi feito primeiro). */
function maxBy(matches: Match[], value: (match: Match) => number): Match | null {
  let best: Match | null = null;
  for (const match of matches) if (!best || value(match) > value(best)) best = match;
  return best;
}

function longestStreak(matches: Match[], counts: (match: Match) => boolean): StreakRecord | null {
  let best: StreakRecord | null = null;
  let start = 0;
  for (let index = 0; index <= matches.length; index++) {
    if (index < matches.length && counts(matches[index])) continue;
    const length = index - start;
    if (length > 0 && (!best || length > best.length)) {
      best = { length, first: matches[start], last: matches[index - 1] };
    }
    start = index + 1;
  }
  return best;
}

function currentStreak(matches: Match[]): ClubRecords["currentStreak"] {
  const last = matches.at(-1);
  if (!last) return null;
  let length = 0;
  for (let index = matches.length - 1; index >= 0 && matches[index].result === last.result; index--) {
    length++;
  }
  return { result: last.result, length };
}

/** `matches` em ordem cronológica (mais antiga → mais recente). */
export function computeClubRecords(matches: Match[]): ClubRecords {
  const wins = matches.filter((match) => match.result === "W");
  const losses = matches.filter((match) => match.result === "L");

  return {
    biggestWin: maxBy(wins, (match) => margin(match) * 100 + match.goalsFor),
    worstLoss: maxBy(losses, (match) => -margin(match) * 100 + match.goalsAgainst),
    highestScoring: maxBy(matches, totalGoals),
    longestWinStreak: longestStreak(matches, (match) => match.result === "W"),
    longestUnbeatenStreak: longestStreak(matches, (match) => match.result !== "L"),
    currentStreak: currentStreak(matches),
  };
}

// -----------------------------------------------------------------------------
// Recordes individuais
// -----------------------------------------------------------------------------

export interface IndividualRecord {
  stat: ClubPlayerMatchStat;
  match: Match;
  value: number;
}

/** Top N atuações numa partida para uma estatística (empate → a mais antiga). */
export function topPerformances(
  stats: ClubPlayerMatchStat[],
  matchesById: Map<string, Match>,
  value: (stat: ClubPlayerMatchStat) => number | null,
  limit = 3,
): IndividualRecord[] {
  return stats
    .flatMap((stat) => {
      const match = matchesById.get(stat.matchId);
      const score = value(stat);
      return match && score !== null && score > 0 ? [{ stat, match, value: score }] : [];
    })
    .sort((a, b) => b.value - a.value || a.match.playedAt.localeCompare(b.match.playedAt))
    .slice(0, limit);
}

export interface HatTrickCount {
  playerId: string;
  playerName: string;
  count: number;
}

export function countHatTricks(stats: ClubPlayerMatchStat[]): HatTrickCount[] {
  const counts = new Map<string, HatTrickCount>();
  for (const stat of stats) {
    if (stat.stats.goals < 3) continue;
    const entry = counts.get(stat.playerId) ?? {
      playerId: stat.playerId,
      playerName: stat.playerName,
      count: 0,
    };
    entry.count++;
    counts.set(stat.playerId, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName));
}
