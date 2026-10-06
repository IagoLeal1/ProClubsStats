import type { ClubPlayerMatchStat, Match } from "@/types/match";
import type { Player } from "@/types/player";

/** Quantos jogos recentes contam para a fase. */
export const FORM_GAMES = 5;
/** Com menos jogos salvos que isso, ainda não dá para falar em fase. */
export const FORM_MIN_GAMES = 3;
/** Diferença de nota (para mais ou para menos) que marca em alta / em baixa. */
export const FORM_THRESHOLD = 0.3;

export type FormTrend = "up" | "down" | "steady";

export interface PlayerForm {
  /** Notas dos últimos jogos, do mais antigo para o mais recente. */
  ratings: number[];
  recentAverage: number;
  /** Média da temporada no clube (EA) ou, sem ela, das partidas salvas. */
  baseline: number;
  /** Diferença arredondada a uma casa, como aparece na tela. */
  delta: number;
  trend: FormTrend;
}

/** Em alta / em baixa a partir da diferença de nota (já arredondada). */
export const trendOf = (delta: number): FormTrend =>
  delta >= FORM_THRESHOLD ? "up" : delta <= -FORM_THRESHOLD ? "down" : "steady";

const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

/** `ratings` vai do jogo mais recente para o mais antigo. */
export function computeForm(ratings: number[], seasonAverage: number | null): PlayerForm | null {
  const recent = ratings.slice(0, FORM_GAMES);
  if (recent.length < FORM_MIN_GAMES) return null;

  const recentAverage = average(recent);
  const baseline = seasonAverage ?? average(ratings);
  const delta = Math.round((recentAverage - baseline) * 10) / 10;
  return { ratings: [...recent].reverse(), recentAverage, baseline, delta, trend: trendOf(delta) };
}

/** Fase de cada jogador do elenco, pelas partidas salvas. */
export function computeSquadForm(
  matches: Match[],
  stats: ClubPlayerMatchStat[],
  players: Player[],
): Map<string, PlayerForm> {
  const playedAt = new Map<string, number>();
  for (const match of matches) playedAt.set(match.id, Date.parse(match.playedAt));

  const history = new Map<string, { at: number; rating: number }[]>();
  for (const stat of stats) {
    if (stat.stats.rating === null) continue;
    const entries = history.get(stat.playerId) ?? [];
    entries.push({ at: playedAt.get(stat.matchId) ?? 0, rating: stat.stats.rating });
    history.set(stat.playerId, entries);
  }

  const forms = new Map<string, PlayerForm>();
  for (const player of players) {
    const entries = history.get(player.id);
    if (!entries) continue;
    const ratings = entries.sort((a, b) => b.at - a.at).map((entry) => entry.rating);
    const form = computeForm(ratings, player.stats.averageRating);
    if (form) forms.set(player.id, form);
  }
  return forms;
}
