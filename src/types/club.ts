/**
 * Plataformas suportadas. São valores internos — a tradução para os códigos
 * da EA fica em `src/lib/ea/constants.ts`.
 */
export const PLATFORMS = ["crossplay", "switch"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  crossplay: "PS5 / Xbox Series / PC",
  switch: "Nintendo Switch",
};

export interface ClubRecord {
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Dados de um clube vindos de uma fonte externa (ainda não persistidos). */
export interface ClubSnapshot {
  eaClubId: number;
  platform: Platform;
  name: string;
  crestUrl: string | null;
  regionId: number | null;
  skillRating: number | null;
  record: ClubRecord;
}

/** Clube persistido no nosso banco. */
export interface Club extends ClubSnapshot {
  id: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Item retornado pela busca de clubes. */
export interface ClubSearchResult {
  eaClubId: number;
  platform: Platform;
  name: string;
  crestUrl: string | null;
  record: ClubRecord | null;
}

/** Métricas derivadas — calculadas, não armazenadas. */
export interface ClubMetrics {
  winRate: number | null;
  pointsRate: number | null;
  goalDifference: number;
  goalsPerGame: number | null;
  goalsAgainstPerGame: number | null;
}
