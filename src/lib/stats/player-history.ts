import type { PlayerMatchEntry } from "@/types/match";
import type { Player } from "@/types/player";

/** Estatísticas calculadas a partir das partidas salvas no nosso banco. */
export interface PlayerHistorySummary {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  /** % de vitórias com o jogador em campo (0–100). */
  winRate: number | null;
  goals: number;
  assists: number;
  shots: number;
  averageRating: number | null;
  /** Passes certos / tentados (0–100). */
  passAccuracy: number | null;
  tackles: number;
  manOfTheMatch: number;
  firstPlayedAt: string | null;
  bestMatch: PlayerMatchEntry | null;
}

const percent = (part: number, total: number) => (total > 0 ? (part / total) * 100 : null);

const sum = (entries: PlayerMatchEntry[], value: (entry: PlayerMatchEntry) => number) =>
  entries.reduce((total, entry) => total + value(entry), 0);

/** Melhor nota; empate → mais G+A; depois a mais recente (lista já vem desc). */
function pickBestMatch(entries: PlayerMatchEntry[]): PlayerMatchEntry | null {
  let best: PlayerMatchEntry | null = null;
  for (const entry of entries) {
    if (entry.stats.rating === null) continue;
    if (!best || best.stats.rating === null) {
      best = entry;
      continue;
    }
    const ratingDiff = entry.stats.rating - best.stats.rating;
    const contributionDiff =
      entry.stats.goals + entry.stats.assists - (best.stats.goals + best.stats.assists);
    if (ratingDiff > 0 || (ratingDiff === 0 && contributionDiff > 0)) best = entry;
  }
  return best;
}

/** `entries` deve estar ordenado da partida mais recente para a mais antiga. */
export function summarizePlayerHistory(entries: PlayerMatchEntry[]): PlayerHistorySummary {
  const rated = entries.filter((entry) => entry.stats.rating !== null);
  const wins = entries.filter((entry) => entry.match.result === "W").length;
  const passes = sum(entries, (entry) => entry.stats.passes);

  return {
    matches: entries.length,
    wins,
    draws: entries.filter((entry) => entry.match.result === "D").length,
    losses: entries.filter((entry) => entry.match.result === "L").length,
    winRate: percent(wins, entries.length),
    goals: sum(entries, (entry) => entry.stats.goals),
    assists: sum(entries, (entry) => entry.stats.assists),
    shots: sum(entries, (entry) => entry.stats.shots),
    averageRating:
      rated.length > 0 ? sum(rated, (entry) => entry.stats.rating ?? 0) / rated.length : null,
    passAccuracy: percent(sum(entries, (entry) => entry.stats.passesCompleted), passes),
    tackles: sum(entries, (entry) => entry.stats.tackles),
    manOfTheMatch: entries.filter((entry) => entry.stats.manOfTheMatch).length,
    firstPlayedAt: entries.at(-1)?.match.playedAt ?? null,
    bestMatch: pickBestMatch(entries),
  };
}

export interface SquadRank {
  position: number;
  total: number;
}

/**
 * Posição do jogador no elenco atual para uma estatística (1 = melhor).
 * Empates dividem a posição (dois artilheiros com 10 gols são ambos 1º).
 */
export function rankInSquad(
  squad: Player[],
  player: Player,
  value: (player: Player) => number | null,
): SquadRank | null {
  const own = value(player);
  if (own === null || !player.isMember || player.stats.gamesPlayed === 0) return null;

  const values = squad
    .filter((member) => member.isMember && member.stats.gamesPlayed > 0)
    .map(value)
    .filter((candidate): candidate is number => candidate !== null);

  return {
    position: values.filter((candidate) => candidate > own).length + 1,
    total: values.length,
  };
}
