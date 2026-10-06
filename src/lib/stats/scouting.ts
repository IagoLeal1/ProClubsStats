import type { Player } from "@/types/player";

import type { SquadRank } from "./player-history";

/** Mínimo de jogos na temporada para entrar na comparação do elenco. */
export const MIN_SCOUT_GAMES = 5;

export type ScoutFormat = "decimal" | "percent" | "rating";

export interface ScoutMetric {
  key: string;
  label: string;
  value: number | null;
  format: ScoutFormat;
  /** 0–100 dentro do elenco (100 = melhor). null sem comparação possível. */
  percentile: number | null;
  rank: SquadRank | null;
}

interface MetricDefinition {
  key: string;
  label: string;
  format: ScoutFormat;
  value: (player: Player) => number | null;
}

const perGame = (total: number, player: Player) =>
  player.stats.gamesPlayed > 0 ? total / player.stats.gamesPlayed : null;

/** Números da temporada (EA) por jogo ou em %; todos são "quanto maior, melhor". */
const METRICS: MetricDefinition[] = [
  { key: "goals", label: "Gols por jogo", format: "decimal", value: (p) => perGame(p.stats.goals, p) },
  { key: "assists", label: "Assistências por jogo", format: "decimal", value: (p) => perGame(p.stats.assists, p) },
  { key: "shotRate", label: "Finalização certa", format: "percent", value: (p) => p.stats.shotSuccessRate },
  { key: "passes", label: "Passes por jogo", format: "decimal", value: (p) => perGame(p.stats.passesMade, p) },
  { key: "passRate", label: "Passes certos", format: "percent", value: (p) => p.stats.passSuccessRate },
  { key: "tackles", label: "Desarmes por jogo", format: "decimal", value: (p) => perGame(p.stats.tacklesMade, p) },
  { key: "tackleRate", label: "Desarmes certos", format: "percent", value: (p) => p.stats.tackleSuccessRate },
  {
    key: "mvpRate",
    label: "Jogos como MVP",
    format: "percent",
    value: (p) => {
      const rate = perGame(p.stats.manOfTheMatch, p);
      return rate === null ? null : rate * 100;
    },
  },
  { key: "rating", label: "Nota média", format: "rating", value: (p) => p.stats.averageRating },
];

/**
 * Raio-X do jogador: cada número da temporada comparado com o resto do
 * elenco atual (membros com MIN_SCOUT_GAMES+ jogos). O percentil conta quem
 * fica abaixo, com empates valendo meio.
 */
export function scoutPlayer(squad: Player[], player: Player): ScoutMetric[] {
  const pool = squad.filter((member) => member.isMember && member.stats.gamesPlayed >= MIN_SCOUT_GAMES);
  const inPool = pool.some((member) => member.id === player.id);

  return METRICS.map((metric) => {
    const value = metric.value(player);
    const base = { key: metric.key, label: metric.label, format: metric.format, value };
    if (value === null || !inPool) return { ...base, percentile: null, rank: null };

    const others = pool
      .filter((member) => member.id !== player.id)
      .map(metric.value)
      .filter((other): other is number => other !== null);
    if (others.length === 0) return { ...base, percentile: null, rank: null };

    const below = others.filter((other) => other < value).length;
    const tied = others.filter((other) => other === value).length;
    return {
      ...base,
      percentile: ((below + tied / 2) / others.length) * 100,
      rank: { position: others.filter((other) => other > value).length + 1, total: others.length + 1 },
    };
  });
}
