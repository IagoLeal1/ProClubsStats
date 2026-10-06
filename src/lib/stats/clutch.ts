import type { ClubPlayerMatchStat, Match } from "@/types/match";

import { recordSlice, type RecordSlice } from "./sessions";

/** Jogo decisivo: diferença de no máximo 1 gol (empates incluídos). */
export const CLOSE_MARGIN = 1;
/** Mínimo de jogos decisivos para entrar no ranking. */
export const MIN_CLUTCH_GAMES = 3;

/** Abandonos (vitória por W.O.) não contam: o placar não reflete o jogo. */
export const isCloseMatch = (match: Match) =>
  !match.decidedByDnf && Math.abs(match.goalsFor - match.goalsAgainst) <= CLOSE_MARGIN;

export interface ClutchPlayer {
  playerId: string;
  playerName: string;
  closeGames: number;
  closeRating: number;
  /** Nota média em todas as partidas salvas, para comparar. */
  overallRating: number;
  goals: number;
  assists: number;
}

export interface ClutchSummary {
  close: RecordSlice | null;
  /** Os demais jogos (diferença de 2+ gols). */
  others: RecordSlice | null;
  /** Melhor nota nos jogos decisivos primeiro. */
  players: ClutchPlayer[];
}

const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

export function computeClutch(matches: Match[], stats: ClubPlayerMatchStat[]): ClutchSummary {
  const close = new Set(matches.filter(isCloseMatch).map((match) => match.id));
  const byPlayer = new Map<string, { name: string; all: number[]; close: number[]; goals: number; assists: number }>();

  for (const stat of stats) {
    if (stat.stats.rating === null) continue;
    const entry = byPlayer.get(stat.playerId) ?? { name: stat.playerName, all: [], close: [], goals: 0, assists: 0 };
    entry.all.push(stat.stats.rating);
    if (close.has(stat.matchId)) {
      entry.close.push(stat.stats.rating);
      entry.goals += stat.stats.goals;
      entry.assists += stat.stats.assists;
    }
    byPlayer.set(stat.playerId, entry);
  }

  const players = [...byPlayer.entries()]
    .filter(([, entry]) => entry.close.length >= MIN_CLUTCH_GAMES)
    .map(([playerId, entry]) => ({
      playerId,
      playerName: entry.name,
      closeGames: entry.close.length,
      closeRating: average(entry.close),
      overallRating: average(entry.all),
      goals: entry.goals,
      assists: entry.assists,
    }))
    .sort((a, b) => b.closeRating - a.closeRating || b.closeGames - a.closeGames);

  return {
    close: recordSlice(matches.filter((match) => close.has(match.id))),
    others: recordSlice(matches.filter((match) => !close.has(match.id))),
    players,
  };
}
