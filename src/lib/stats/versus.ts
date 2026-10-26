import { formatInteger, formatPercent } from "@/lib/format";
import type { ClubPlayerMatchStat, Match } from "@/types/match";

import { computeAssistLinks } from "./partnerships";
import { rate, recordSlice, type RecordSlice } from "./sessions";

/**
 * Duelo entre dois jogadores do mesmo clube.
 *
 * "Juntos": só as partidas em que os dois estavam em campo, então os totais
 * são comparáveis (mesmo jogo, mesmo adversário). "Geral": média por jogo em
 * todas as partidas salvas de cada um, para quem quase não jogou junto.
 */

export const VERSUS_SCOPES = ["juntos", "geral"] as const;
export type VersusScope = (typeof VERSUS_SCOPES)[number];

export type DuelFormat = "integer" | "decimal" | "percent";

const perGameFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FORMATTERS: Record<DuelFormat, (value: number | null) => string> = {
  integer: formatInteger,
  decimal: (value) => (value === null ? "—" : perGameFormat.format(value)),
  percent: (value) => formatPercent(value),
};

export const formatDuelValue = (format: DuelFormat, value: number | null) => FORMATTERS[format](value);

export interface DuelRow {
  label: string;
  a: number | null;
  b: number | null;
  format: DuelFormat;
  /** Passes errados: vence o menor. */
  lowerIsBetter?: boolean;
  /** Ex.: "desde 18/10" para pré-assistências. */
  hint?: string;
}

export interface DuelTally {
  a: number;
  b: number;
}

export interface Duel {
  scope: VersusScope;
  /** Jogos considerados: juntos, ou de cada um no geral. */
  games: { a: number; b: number };
  rows: DuelRow[];
  /** Quantas estatísticas cada um leva (empates não contam). */
  score: DuelTally;
}

export interface Together {
  both: RecordSlice | null;
  onlyA: RecordSlice | null;
  onlyB: RecordSlice | null;
  /** Nos jogos juntos: quantas vezes cada um teve a nota maior. */
  higherRating: DuelTally & { ties: number };
  /** Assistências confirmadas de um para o outro. */
  assistsAToB: number;
  assistsBToA: number;
}

interface Totals {
  games: number;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  trackedGames: number;
  secondAssists: number;
}

const emptyTotals = (): Totals => ({
  games: 0,
  goals: 0,
  assists: 0,
  shots: 0,
  passes: 0,
  passesCompleted: 0,
  tackles: 0,
  trackedGames: 0,
  secondAssists: 0,
});

function add(totals: Totals, stat: ClubPlayerMatchStat) {
  totals.games++;
  totals.goals += stat.stats.goals;
  totals.assists += stat.stats.assists;
  totals.shots += stat.stats.shots;
  totals.passes += stat.stats.passes;
  totals.passesCompleted += stat.stats.passesCompleted;
  totals.tackles += stat.stats.tackles;
  if (stat.stats.secondAssists !== null) {
    totals.trackedGames++;
    totals.secondAssists += stat.stats.secondAssists;
  }
}

/** Estatísticas de cada um nas partidas válidas (sem abandono), por partida. */
function statsByMatch(
  playerId: string,
  matches: Map<string, Match>,
  stats: ClubPlayerMatchStat[],
): Map<string, ClubPlayerMatchStat> {
  return new Map(
    stats
      .filter((stat) => stat.playerId === playerId && matches.has(stat.matchId))
      .map((stat) => [stat.matchId, stat]),
  );
}

function duelRows(a: Totals, b: Totals, scope: VersusScope, trackedHint: string | undefined): DuelRow[] {
  // No geral, tudo vira média por jogo (pré-assistências: por jogo com o dado).
  const value = (totals: Totals, total: number, games = totals.games) =>
    scope === "juntos" ? total : games > 0 ? total / games : null;
  const format: DuelFormat = scope === "juntos" ? "integer" : "decimal";
  const tracked = (totals: Totals) =>
    totals.trackedGames > 0 ? value(totals, totals.secondAssists, totals.trackedGames) : null;
  const row = (label: string, of: (totals: Totals) => number | null, extra: Partial<DuelRow> = {}): DuelRow => ({
    label,
    a: of(a),
    b: of(b),
    format,
    ...extra,
  });

  return [
    row("Gols", (t) => value(t, t.goals)),
    row("Assistências", (t) => value(t, t.assists)),
    row("Pré-assistências", tracked, { hint: trackedHint }),
    row("Passes certos", (t) => value(t, t.passesCompleted)),
    row("Passes errados", (t) => value(t, t.passes - t.passesCompleted), { lowerIsBetter: true }),
    row("Conversão", (t) => rate(t.goals, t.shots), { format: "percent" }),
    row("Desarmes", (t) => value(t, t.tackles)),
  ];
}

function tally(rows: DuelRow[]): DuelTally {
  const score = { a: 0, b: 0 };
  for (const row of rows) {
    if (row.a === null || row.b === null || row.a === row.b) continue;
    const aAhead = row.lowerIsBetter ? row.a < row.b : row.a > row.b;
    if (aAhead) score.a++;
    else score.b++;
  }
  return score;
}

/** Adversário padrão do duelo: o membro com mais jogos (sem repetir quem já está). */
export function pickDuelOpponent<T extends { id: string; isMember: boolean; stats: { gamesPlayed: number } }>(
  squad: T[],
  excludeId?: string,
): T | null {
  return (
    [...squad]
      .filter((player) => player.isMember && player.id !== excludeId)
      .sort((a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed)[0] ?? null
  );
}

export interface VersusResult {
  duel: Duel;
  together: Together;
}

export function compareTwoPlayers(
  aId: string,
  bId: string,
  matches: Match[],
  stats: ClubPlayerMatchStat[],
  options: { scope: VersusScope; trackedSince: string | null },
): VersusResult {
  const valid = matches.filter((match) => !match.decidedByDnf);
  const validById = new Map(valid.map((match) => [match.id, match]));
  const statsA = statsByMatch(aId, validById, stats);
  const statsB = statsByMatch(bId, validById, stats);

  const both: Match[] = [];
  const onlyA: Match[] = [];
  const onlyB: Match[] = [];
  const higherRating = { a: 0, b: 0, ties: 0 };
  const together = { a: emptyTotals(), b: emptyTotals() };
  const overall = { a: emptyTotals(), b: emptyTotals() };

  for (const match of valid) {
    const statA = statsA.get(match.id);
    const statB = statsB.get(match.id);
    if (statA) add(overall.a, statA);
    if (statB) add(overall.b, statB);
    if (statA && statB) {
      both.push(match);
      add(together.a, statA);
      add(together.b, statB);
      const ratingA = statA.stats.rating;
      const ratingB = statB.stats.rating;
      if (ratingA !== null && ratingB !== null) {
        if (ratingA > ratingB) higherRating.a++;
        else if (ratingB > ratingA) higherRating.b++;
        else higherRating.ties++;
      }
    } else if (statA) onlyA.push(match);
    else if (statB) onlyB.push(match);
  }

  // Sem nenhum jogo juntos, o duelo só faz sentido no geral.
  const scope = options.scope === "juntos" && both.length === 0 ? "geral" : options.scope;
  const totals = scope === "juntos" ? together : overall;
  const trackedHint = options.trackedSince ? `desde ${options.trackedSince}` : undefined;
  const rows = duelRows(totals.a, totals.b, scope, trackedHint);

  const { links } = computeAssistLinks(matches, stats);
  const assists = (from: string, to: string) =>
    links.find((link) => link.fromId === from && link.toId === to)?.assists ?? 0;

  return {
    duel: {
      scope,
      games: { a: totals.a.games, b: totals.b.games },
      rows,
      score: tally(rows),
    },
    together: {
      both: recordSlice(both),
      onlyA: recordSlice(onlyA),
      onlyB: recordSlice(onlyB),
      higherRating,
      assistsAToB: assists(aId, bId),
      assistsBToA: assists(bId, aId),
    },
  };
}
