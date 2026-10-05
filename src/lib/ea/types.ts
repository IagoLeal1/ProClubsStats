import { z } from "zod";

/**
 * Formato das respostas JSON da EA, validado com Zod.
 * Estes tipos NUNCA saem de `src/lib/ea/` — o resto da aplicação usa os
 * modelos internos de `src/types/` produzidos por `mappers.ts`.
 *
 * Todos os campos são tolerantes (nullish): a API não é oficial e pode omitir
 * ou mudar campos. Campos ausentes viram `null` e o mapper decide o fallback.
 */

function toNumberOrNull(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A EA serializa números como string ("12"); vazio ou inválido vira null. */
const eaNumber = z
  .union([z.string(), z.number()])
  .nullish()
  .transform(toNumberOrNull);

const eaText = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() !== "" ? value : null));

/** IDs grandes (ex.: matchId "29408884170075") são tratados como texto. */
const eaId = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((value) =>
    value === null || value === undefined || value === "" ? null : String(value),
  );

// -----------------------------------------------------------------------------
// Clube
// -----------------------------------------------------------------------------

export const EAClubDetailsSchema = z.object({
  name: eaText,
  clubId: eaNumber,
  regionId: eaNumber,
  customKit: z
    .object({
      crestAssetId: eaText,
    })
    .nullish(),
});
export type EAClubDetails = z.output<typeof EAClubDetailsSchema>;

/** GET /clubs/info?platform&clubIds → { "<clubId>": EAClubDetails } */
export const EAClubInfoResponseSchema = z.record(z.string(), EAClubDetailsSchema);

export const EAClubOverallStatsSchema = z.object({
  clubId: eaNumber,
  gamesPlayed: eaNumber,
  wins: eaNumber,
  ties: eaNumber,
  losses: eaNumber,
  goals: eaNumber,
  goalsAgainst: eaNumber,
  skillRating: eaNumber,
});
export type EAClubOverallStats = z.output<typeof EAClubOverallStatsSchema>;

/** GET /clubs/overallStats?platform&clubIds → EAClubOverallStats[] */
export const EAClubOverallStatsResponseSchema = z.array(EAClubOverallStatsSchema);

export const EALeaderboardEntrySchema = z.object({
  clubId: eaNumber,
  clubName: eaText,
  gamesPlayed: eaNumber,
  wins: eaNumber,
  ties: eaNumber,
  losses: eaNumber,
  goals: eaNumber,
  goalsAgainst: eaNumber,
  clubInfo: EAClubDetailsSchema.nullish(),
});
export type EALeaderboardEntry = z.output<typeof EALeaderboardEntrySchema>;

/** GET /allTimeLeaderboard/search?platform&clubName → EALeaderboardEntry[] */
export const EALeaderboardSearchResponseSchema = z.array(EALeaderboardEntrySchema);

// -----------------------------------------------------------------------------
// Membros
// -----------------------------------------------------------------------------

export const EAMemberSchema = z.object({
  /** Gamertag. A API de membros não expõe ID numérico do jogador. */
  name: eaText,
  proName: eaText,
  proPos: eaNumber,
  proOverall: eaNumber,
  favoritePosition: eaText,
  gamesPlayed: eaNumber,
  goals: eaNumber,
  assists: eaNumber,
  ratingAve: eaNumber,
  passesMade: eaNumber,
  passSuccessRate: eaNumber,
  tacklesMade: eaNumber,
  tackleSuccessRate: eaNumber,
  shotSuccessRate: eaNumber,
  winRate: eaNumber,
  manOfTheMatch: eaNumber,
  redCards: eaNumber,
});
export type EAMember = z.output<typeof EAMemberSchema>;

/** GET /members/stats?platform&clubId → { members: EAMember[] } */
export const EAMembersResponseSchema = z.object({
  members: z.array(EAMemberSchema),
});

// -----------------------------------------------------------------------------
// Partidas
// -----------------------------------------------------------------------------

export const EAMatchClubSchema = z.object({
  goals: eaNumber,
  goalsAgainst: eaNumber,
  score: eaNumber,
  /** 1/0 por partida em jogos competitivos; sempre 0 em amistosos. */
  wins: eaNumber,
  losses: eaNumber,
  ties: eaNumber,
  winnerByDnf: eaNumber,
  details: EAClubDetailsSchema.nullish(),
});
export type EAMatchClub = z.output<typeof EAMatchClubSchema>;

export const EAMatchPlayerSchema = z.object({
  playername: eaText,
  /** Grupo de posição: "goalkeeper" | "defender" | "midfielder" | "forward". */
  pos: eaText,
  rating: eaNumber,
  goals: eaNumber,
  assists: eaNumber,
  shots: eaNumber,
  passattempts: eaNumber,
  passesmade: eaNumber,
  tacklesmade: eaNumber,
  tackleattempts: eaNumber,
  redcards: eaNumber,
  saves: eaNumber,
  mom: eaNumber,
  secondsPlayed: eaNumber,
});
export type EAMatchPlayer = z.output<typeof EAMatchPlayerSchema>;

/** Soma das estatísticas dos jogadores de cada clube na partida. */
export const EAMatchAggregateSchema = z.object({
  goals: eaNumber,
  shots: eaNumber,
  passattempts: eaNumber,
  passesmade: eaNumber,
  tacklesmade: eaNumber,
  tackleattempts: eaNumber,
  saves: eaNumber,
  redcards: eaNumber,
});
export type EAMatchAggregate = z.output<typeof EAMatchAggregateSchema>;

export const EAMatchSchema = z.object({
  matchId: eaId,
  /** Unix timestamp em segundos. */
  timestamp: eaNumber,
  clubs: z.record(z.string(), EAMatchClubSchema),
  /** { "<clubId>": { "<playerId>": EAMatchPlayer } } */
  players: z
    .record(z.string(), z.record(z.string(), EAMatchPlayerSchema))
    .nullish(),
  /** { "<clubId>": EAMatchAggregate } */
  aggregate: z.record(z.string(), EAMatchAggregateSchema).nullish(),
});
export type EAMatch = z.output<typeof EAMatchSchema>;

/**
 * GET /clubs/matches?platform&clubIds&matchType → partida[]
 * Cada item é validado individualmente em `matches.ts`, para que uma partida
 * malformada não descarte as demais.
 */
export const EAMatchesResponseSchema = z.array(z.unknown());
