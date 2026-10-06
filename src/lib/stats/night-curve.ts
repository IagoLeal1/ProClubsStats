import type { Match } from "@/types/match";

import { recordSlice, type GameSession, type RecordSlice } from "./sessions";

/** Do 10º jogo da noite em diante, tudo entra numa barra só. */
export const LAST_GAME_BUCKET = 10;

export type NightSlice = RecordSlice;

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
      const bucket = recordSlice(matches);
      return bucket ? [{ ...bucket, order }] : [];
    });

  return {
    nights: sessions.length,
    buckets,
    firstHalf: recordSlice(firstHalf),
    secondHalf: recordSlice(secondHalf),
    overall: recordSlice(sessions.flatMap((session) => session.matches)),
  };
}
