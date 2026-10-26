import type { ClubPlayerMatchStat, Match } from "@/types/match";

/**
 * "O cara decisivo": quantos pontos o time perderia, em cada jogo, sem os gols
 * e as assistências do jogador. Gol no 2×1 vale a vitória; gol no 5×0 não muda
 * nada. A EA não informa a ordem dos gols, então a conta tira de uma vez tudo
 * em que ele participou (e não "quem desempatou").
 */

const pointsFor = (goalsFor: number, goalsAgainst: number) =>
  goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;

/** Pontos (0 a 3) que somem sem as participações dele. Abandonos não contam. */
export function pointsAdded(match: Match, goals: number, assists: number): number {
  if (match.decidedByDnf) return 0;
  const without = Math.max(match.goalsFor - goals - assists, 0);
  return pointsFor(match.goalsFor, match.goalsAgainst) - pointsFor(without, match.goalsAgainst);
}

export interface DecisivePlayer {
  playerId: string;
  playerName: string;
  games: number;
  /** Pontos que o time não teria sem os gols e as assistências dele. */
  points: number;
  /** Vitórias que, sem ele, seriam empate ou derrota. */
  winsSecured: number;
  /** Destas, as que seriam derrota. */
  lossesTurned: number;
  /** Empates que, sem ele, seriam derrota. */
  drawsSaved: number;
  /** Gols e assistências nos jogos em que ele mudou o resultado. */
  goals: number;
  assists: number;
}

/** Mais pontos primeiro; empate fica com quem precisou de menos jogos. */
const byDecisiveness = (a: DecisivePlayer, b: DecisivePlayer) =>
  b.points - a.points || a.games - b.games || b.winsSecured - a.winsSecured;

/** Todos que jogaram as partidas, do mais decisivo para o menos. */
export function computeDecisive(matches: Match[], stats: ClubPlayerMatchStat[]): DecisivePlayer[] {
  const matchesById = new Map(matches.filter((match) => !match.decidedByDnf).map((match) => [match.id, match]));
  const byPlayer = new Map<string, DecisivePlayer>();

  for (const stat of stats) {
    const match = matchesById.get(stat.matchId);
    if (!match) continue;
    const line = byPlayer.get(stat.playerId) ?? {
      playerId: stat.playerId,
      playerName: stat.playerName,
      games: 0,
      points: 0,
      winsSecured: 0,
      lossesTurned: 0,
      drawsSaved: 0,
      goals: 0,
      assists: 0,
    };
    line.games++;
    const added = pointsAdded(match, stat.stats.goals, stat.stats.assists);
    if (added > 0) {
      line.points += added;
      if (added === 1) line.drawsSaved++;
      else line.winsSecured++;
      if (added === 3) line.lossesTurned++;
      line.goals += stat.stats.goals;
      line.assists += stat.stats.assists;
    }
    byPlayer.set(stat.playerId, line);
  }

  return [...byPlayer.values()].sort(byDecisiveness);
}

/** O mais decisivo, se alguém mudou algum resultado. */
export function topDecisive(players: DecisivePlayer[]): DecisivePlayer | null {
  return players[0] && players[0].points > 0 ? players[0] : null;
}
