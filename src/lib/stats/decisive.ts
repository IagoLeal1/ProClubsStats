import type { ClubPlayerMatchStat, Match } from "@/types/match";

/**
 * "O cara decisivo": gols e assistências pesam pelo que valeram no placar.
 *
 * Em cada jogo, os gols do time renderam os pontos conquistados menos os que o
 * time teria sem marcar nada; esse valor é dividido igualmente entre os gols, e
 * quem marca e quem dá a assistência levam a parte do gol. A EA não informa a
 * ordem dos gols, então dividir igualmente é o mesmo que tirar a média de todas
 * as ordens possíveis. Ex.: no 2×1 cada gol vale 1,5; no 2×0, 1; no 8×1, 0,375.
 */

const pointsFor = (goalsFor: number, goalsAgainst: number) =>
  goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;

/** Quanto vale cada gol do time no jogo. Abandonos não contam. */
export function goalValue(match: Match): number {
  if (match.decidedByDnf || match.goalsFor === 0) return 0;
  return (pointsFor(match.goalsFor, match.goalsAgainst) - pointsFor(0, match.goalsAgainst)) / match.goalsFor;
}

export interface DecisivePlayer {
  playerId: string;
  playerName: string;
  games: number;
  /** Soma do valor dos gols em que ele marcou ou deu a assistência. */
  points: number;
  /** Vitórias e empates em que ele marcou ou deu assistência. */
  wins: number;
  draws: number;
  /** Gols e assistências que valeram pontos (em vitórias e empates). */
  goals: number;
  assists: number;
}

/** Mais pontos primeiro; empate fica com quem precisou de menos jogos. */
const byDecisiveness = (a: DecisivePlayer, b: DecisivePlayer) =>
  b.points - a.points || a.games - b.games || b.wins - a.wins;

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
      wins: 0,
      draws: 0,
      goals: 0,
      assists: 0,
    };
    line.games++;
    const value = goalValue(match);
    const { goals, assists } = stat.stats;
    if (value > 0 && goals + assists > 0) {
      line.points += (goals + assists) * value;
      line.goals += goals;
      line.assists += assists;
      if (match.goalsFor > match.goalsAgainst) line.wins++;
      else line.draws++;
    }
    byPlayer.set(stat.playerId, line);
  }

  return [...byPlayer.values()].sort(byDecisiveness);
}

/** O mais decisivo, se alguém fez gol ou deu assistência que valeu ponto. */
export function topDecisive(players: DecisivePlayer[]): DecisivePlayer | null {
  return players[0] && players[0].points > 0 ? players[0] : null;
}
