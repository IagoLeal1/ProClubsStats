import type { ClubPlayerMatchStat, Match } from "@/types/match";
import type { Player } from "@/types/player";

import { recordSlice, type RecordSlice } from "./sessions";

/** Mínimo de jogos com e sem o jogador para comparar os dois lados. */
export const MIN_IMPACT_GAMES = 3;

export interface PlayerImpact {
  playerId: string;
  playerName: string;
  withPlayer: RecordSlice;
  /** null quando ele jogou todas as partidas salvas. */
  withoutPlayer: RecordSlice | null;
  /** Diferença de aproveitamento em pontos (com − sem); null sem jogos suficientes dos dois lados. */
  delta: number | null;
}

/** Saldo de gols por jogo de um recorte. */
export const goalDifferencePerGame = (slice: RecordSlice) => (slice.goalsFor - slice.goalsAgainst) / slice.games;

/**
 * Aproveitamento do time com e sem cada membro do elenco em campo, nas
 * partidas salvas. Ordem: maior impacto positivo primeiro.
 */
export function computeImpact(matches: Match[], stats: ClubPlayerMatchStat[], players: Player[]): PlayerImpact[] {
  const playedBy = new Map<string, Set<string>>();
  for (const stat of stats) {
    const played = playedBy.get(stat.playerId) ?? new Set<string>();
    played.add(stat.matchId);
    playedBy.set(stat.playerId, played);
  }

  const impacts = players.flatMap((player) => {
    const played = playedBy.get(player.id);
    if (!player.isMember || !played) return [];
    const withPlayer = recordSlice(matches.filter((match) => played.has(match.id)));
    if (!withPlayer) return [];
    const withoutPlayer = recordSlice(matches.filter((match) => !played.has(match.id)));
    const comparable =
      withPlayer.games >= MIN_IMPACT_GAMES && withoutPlayer !== null && withoutPlayer.games >= MIN_IMPACT_GAMES;
    return [
      {
        playerId: player.id,
        playerName: player.name,
        withPlayer,
        withoutPlayer,
        delta: comparable ? withPlayer.pointsRate - withoutPlayer.pointsRate : null,
      },
    ];
  });

  return impacts.sort(
    (a, b) =>
      (b.delta ?? Number.NEGATIVE_INFINITY) - (a.delta ?? Number.NEGATIVE_INFINITY) ||
      b.withPlayer.games - a.withPlayer.games,
  );
}
