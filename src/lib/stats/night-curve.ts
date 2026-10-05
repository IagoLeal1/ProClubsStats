import type { Match } from "@/types/match";

import { sessionRecord, type GameSession, type SessionRecord } from "./sessions";

/** Do 10º jogo da noite em diante, tudo entra numa barra só. */
export const LAST_GAME_BUCKET = 10;

export interface NightSlice extends SessionRecord {
  games: number;
  /** Aproveitamento (0–100): pontos ganhos sobre pontos disputados. */
  pointsRate: number;
}

export interface NightGameBucket extends NightSlice {
  /** 1 = primeiro jogo da noite; LAST_GAME_BUCKET inclui os seguintes. */
  order: number;
}

export interface NightCurve {
  nights: number;
  /** Ordem do jogo na noite, do 1º ao LAST_GAME_BUCKET. */
  buckets: NightGameBucket[];
  /** 1ª metade de cada noite com 2+ jogos (o jogo do meio, em noites ímpares, fica de fora). */
  firstHalf: NightSlice | null;
  secondHalf: NightSlice | null;
  overall: NightSlice | null;
}

function slice(matches: Match[]): NightSlice | null {
  if (matches.length === 0) return null;
  const record = sessionRecord(matches);
  return {
    ...record,
    games: matches.length,
    pointsRate: ((record.wins * 3 + record.draws) / (matches.length * 3)) * 100,
  };
}

/** Como o time rende ao longo da noite: o 1º jogo, o 2º… e as duas metades. */
export function computeNightCurve(sessions: GameSession[]): NightCurve {
  const byOrder = new Map<number, Match[]>();
  const firstHalf: Match[] = [];
  const secondHalf: Match[] = [];

  for (const { matches } of sessions) {
    matches.forEach((match, index) => {
      const order = Math.min(index + 1, LAST_GAME_BUCKET);
      const bucket = byOrder.get(order) ?? [];
      bucket.push(match);
      byOrder.set(order, bucket);

      if (matches.length < 2) return;
      if (index < Math.floor(matches.length / 2)) firstHalf.push(match);
      else if (index >= Math.ceil(matches.length / 2)) secondHalf.push(match);
    });
  }

  const buckets = [...byOrder.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([order, matches]) => {
      const bucket = slice(matches);
      return bucket ? [{ ...bucket, order }] : [];
    });

  return {
    nights: sessions.length,
    buckets,
    firstHalf: slice(firstHalf),
    secondHalf: slice(secondHalf),
    overall: slice(sessions.flatMap((session) => session.matches)),
  };
}
