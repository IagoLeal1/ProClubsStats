export const POSITION_GROUPS = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;
export type PositionGroup = (typeof POSITION_GROUPS)[number];

export interface PlayerSeasonStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number | null;
  passesMade: number;
  passSuccessRate: number | null;
  tacklesMade: number;
  tackleSuccessRate: number | null;
  shotSuccessRate: number | null;
  winRate: number | null;
  manOfTheMatch: number;
  redCards: number;
}

/** Jogador vindo de fonte externa (lista de membros do clube). */
export interface PlayerSnapshot {
  name: string;
  proName: string | null;
  /** Sigla da posição (ex.: "ST"), quando o código for conhecido. */
  position: string | null;
  positionCode: number | null;
  favoritePosition: PositionGroup | null;
  overall: number | null;
  stats: PlayerSeasonStats;
}

/** Jogador persistido no nosso banco. */
export interface Player extends PlayerSnapshot {
  id: string;
  clubId: string;
  eaPlayerId: string | null;
  isMember: boolean;
  lastSyncedAt: string | null;
}
