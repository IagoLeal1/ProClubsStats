import type { ClubPlayerMatchStat, Match } from "@/types/match";

import { computeDuel, type DuelTally } from "./versus";

/**
 * "Rei do x1": todos contra todos. Cada par duela nos jogos em que os dois
 * estavam em campo (o mesmo duelo da página x1) e o resultado entra numa
 * tabela de campeonato: 3 pontos por vitória, 1 por empate.
 */

/** Mínimo de jogos juntos para o duelo valer. */
export const MIN_X1_GAMES = 5;

export interface X1Player {
  id: string;
  name: string;
}

export interface X1Duel {
  /** Placar do ponto de vista de `a`. */
  a: string;
  b: string;
  score: DuelTally;
  games: number;
}

export interface X1Line {
  playerId: string;
  playerName: string;
  duels: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  /** Estatísticas vencidas e perdidas somando todos os duelos. */
  statsFor: number;
  statsAgainst: number;
}

export interface X1Table {
  lines: X1Line[];
  /** Duelo de cada par, pela chave `idA:idB` (nas duas ordens). */
  duels: Map<string, X1Duel>;
}

export const x1Key = (a: string, b: string) => `${a}:${b}`;

const byStanding = (a: X1Line, b: X1Line) =>
  b.points - a.points ||
  b.statsFor - b.statsAgainst - (a.statsFor - a.statsAgainst) ||
  b.statsFor - a.statsFor ||
  a.playerName.localeCompare(b.playerName);

export function computeX1Table(players: X1Player[], matches: Match[], stats: ClubPlayerMatchStat[]): X1Table {
  const lines = new Map<string, X1Line>(
    players.map((player) => [
      player.id,
      {
        playerId: player.id,
        playerName: player.name,
        duels: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        statsFor: 0,
        statsAgainst: 0,
      },
    ]),
  );
  const duels = new Map<string, X1Duel>();

  players.forEach((a, index) => {
    for (const b of players.slice(index + 1)) {
      const duel = computeDuel(a.id, b.id, matches, stats, { scope: "juntos", trackedSince: null });
      if (duel.scope !== "juntos" || duel.games.a < MIN_X1_GAMES) continue;

      const { score } = duel;
      duels.set(x1Key(a.id, b.id), { a: a.id, b: b.id, score, games: duel.games.a });
      duels.set(x1Key(b.id, a.id), { a: b.id, b: a.id, score: { a: score.b, b: score.a }, games: duel.games.a });

      const lineA = lines.get(a.id);
      const lineB = lines.get(b.id);
      if (!lineA || !lineB) continue;
      for (const [line, own, other] of [
        [lineA, score.a, score.b],
        [lineB, score.b, score.a],
      ] as const) {
        line.duels++;
        line.statsFor += own;
        line.statsAgainst += other;
        if (own > other) {
          line.wins++;
          line.points += 3;
        } else if (own === other) {
          line.draws++;
          line.points += 1;
        } else {
          line.losses++;
        }
      }
    }
  });

  return {
    lines: [...lines.values()].filter((line) => line.duels > 0).sort(byStanding),
    duels,
  };
}
