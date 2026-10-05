import type { ClubPlayerMatchStat, Match } from "@/types/match";

// -----------------------------------------------------------------------------
// Conexões de assistência (quem deu o passe para quem)
// -----------------------------------------------------------------------------
//
// A EA não informa lance a lance: só o total de gols e de assistências de cada
// jogador por partida. Para cada partida consideramos TODAS as distribuições
// possíveis das assistências e contamos, para cada par (assistente → autor),
// só o mínimo que aparece em todas elas. Ou seja: o número é garantido, nunca
// estimado. Restrições usadas:
//   - ninguém dá assistência para o próprio gol;
//   - cada gol tem no máximo uma assistência;
//   - gols da IA ou contra (goalsFor − gols dos jogadores) também podem ter
//     recebido o passe, então entram como um destino "outros".

const OTHERS = "__others__";
/** Partidas ambíguas demais são ignoradas para não travar o cálculo. */
const MAX_SOLUTIONS = 20_000;

interface MatchContribution {
  playerId: string;
  goals: number;
  assists: number;
}

interface Bucket {
  id: string;
  capacity: number;
}

/**
 * Assistências garantidas numa partida: "assistente>autor" → quantidade.
 * Retorna null se os dados forem inconsistentes ou ambíguos demais.
 */
export function certainAssistsInMatch(
  goalsFor: number,
  players: MatchContribution[],
): Map<string, number> | null {
  const assisters = players.filter((player) => player.assists > 0);
  if (assisters.length === 0) return new Map();

  const humanGoals = players.reduce((total, player) => total + player.goals, 0);
  const buckets: Bucket[] = players
    .filter((player) => player.goals > 0)
    .map((player) => ({ id: player.playerId, capacity: player.goals }));
  if (goalsFor > humanGoals) buckets.push({ id: OTHERS, capacity: goalsFor - humanGoals });

  const remaining = new Map(buckets.map((bucket) => [bucket.id, bucket.capacity]));
  const current = new Map<string, number>();
  // Objeto (e não `let`) para o TypeScript enxergar as mudanças feitas nas funções internas.
  const search: { minimum: Map<string, number> | null; solutions: number } = {
    minimum: null,
    solutions: 0,
  };

  function addTo(key: string, delta: number) {
    const next = (current.get(key) ?? 0) + delta;
    if (next === 0) current.delete(key);
    else current.set(key, next);
  }

  function recordSolution() {
    search.solutions++;
    const { minimum } = search;
    if (minimum === null) {
      search.minimum = new Map(current);
      return;
    }
    for (const [key, value] of minimum) minimum.set(key, Math.min(value, current.get(key) ?? 0));
  }

  function place(assisterIndex: number, targetIndex: number, left: number) {
    if (search.solutions > MAX_SOLUTIONS) return;
    const assister = assisters[assisterIndex];
    if (left === 0) {
      if (assisterIndex + 1 === assisters.length) recordSolution();
      else place(assisterIndex + 1, 0, assisters[assisterIndex + 1].assists);
      return;
    }

    const targets = buckets.filter((bucket) => bucket.id !== assister.playerId);
    if (targetIndex === targets.length) return; // não coube: distribuição impossível

    const target = targets[targetIndex];
    const capacity = remaining.get(target.id) ?? 0;
    const key = `${assister.playerId}>${target.id}`;

    for (let amount = Math.min(capacity, left); amount >= 0; amount--) {
      remaining.set(target.id, capacity - amount);
      if (amount > 0) addTo(key, amount);
      place(assisterIndex, targetIndex + 1, left - amount);
      if (amount > 0) addTo(key, -amount);
      remaining.set(target.id, capacity);
    }
  }

  place(0, 0, assisters[0].assists);

  const result = search.minimum;
  if (result === null || search.solutions > MAX_SOLUTIONS) return null;
  for (const [key, value] of result) {
    if (value === 0 || key.endsWith(`>${OTHERS}`)) result.delete(key);
  }
  return result;
}

export interface AssistLink {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  assists: number;
}

export interface AssistLinksSummary {
  links: AssistLink[];
  /** Assistências cujo destino foi possível garantir. */
  confirmedAssists: number;
  totalAssists: number;
}

function groupByMatch(stats: ClubPlayerMatchStat[]): Map<string, ClubPlayerMatchStat[]> {
  const byMatch = new Map<string, ClubPlayerMatchStat[]>();
  for (const stat of stats) {
    const list = byMatch.get(stat.matchId);
    if (list) list.push(stat);
    else byMatch.set(stat.matchId, [stat]);
  }
  return byMatch;
}

export function computeAssistLinks(
  matches: Match[],
  stats: ClubPlayerMatchStat[],
): AssistLinksSummary {
  const names = new Map(stats.map((stat) => [stat.playerId, stat.playerName]));
  const byMatch = groupByMatch(stats);
  const totals = new Map<string, number>();
  let totalAssists = 0;

  for (const match of matches) {
    const players = (byMatch.get(match.id) ?? []).map((stat) => ({
      playerId: stat.playerId,
      goals: stat.stats.goals,
      assists: stat.stats.assists,
    }));
    totalAssists += players.reduce((total, player) => total + player.assists, 0);

    const certain = certainAssistsInMatch(match.goalsFor, players);
    for (const [key, value] of certain ?? []) totals.set(key, (totals.get(key) ?? 0) + value);
  }

  const links = [...totals].map(([key, assists]) => {
    const [fromId, toId] = key.split(">");
    return {
      fromId,
      toId,
      fromName: names.get(fromId) ?? "Jogador",
      toName: names.get(toId) ?? "Jogador",
      assists,
    };
  });
  links.sort((a, b) => b.assists - a.assists || a.fromName.localeCompare(b.fromName));

  return {
    links,
    confirmedAssists: links.reduce((total, link) => total + link.assists, 0),
    totalAssists,
  };
}

// -----------------------------------------------------------------------------
// Duplas em campo
// -----------------------------------------------------------------------------

export interface PlayerPair {
  first: { id: string; name: string };
  second: { id: string; name: string };
  games: number;
  wins: number;
  draws: number;
  losses: number;
  /** % de vitórias com os dois em campo (0–100). */
  winRate: number;
  /** Gols + assistências somados dos dois nessas partidas. */
  goalContributions: number;
}

/** Desempenho do clube em cada partida em que dois jogadores estiveram juntos. */
export function computePairs(matches: Match[], stats: ClubPlayerMatchStat[]): PlayerPair[] {
  const byMatch = groupByMatch(stats);
  const pairs = new Map<string, PlayerPair>();

  for (const match of matches) {
    const players = [...(byMatch.get(match.id) ?? [])].sort((a, b) =>
      a.playerId.localeCompare(b.playerId),
    );

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const [a, b] = [players[i], players[j]];
        const key = `${a.playerId}|${b.playerId}`;
        const pair = pairs.get(key) ?? {
          first: { id: a.playerId, name: a.playerName },
          second: { id: b.playerId, name: b.playerName },
          games: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winRate: 0,
          goalContributions: 0,
        };
        pair.games++;
        if (match.result === "W") pair.wins++;
        else if (match.result === "D") pair.draws++;
        else pair.losses++;
        pair.goalContributions +=
          a.stats.goals + a.stats.assists + b.stats.goals + b.stats.assists;
        pair.winRate = (pair.wins / pair.games) * 100;
        pairs.set(key, pair);
      }
    }
  }

  return [...pairs.values()];
}
