import type { PositionGroup } from "./player";

export const MATCH_TYPES = ["league", "playoff", "friendly"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  league: "Liga",
  playoff: "Playoff",
  friendly: "Amistoso",
};

export type MatchResult = "W" | "D" | "L";

export interface TeamMatchStats {
  goals: number;
  shots: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  tackleAttempts: number;
  saves: number;
  redCards: number;
}

/** Gols de cada tipo na partida (nunca acima dos gols oficiais). */
export interface GoalTypes {
  firstTime: number;
  weakFoot: number;
  /** Cobertura: pode ficar abaixo do real (a EA nem sempre marca). */
  chipped: number;
  offPost: number;
}

export interface PlayerMatchStatsValues {
  position: PositionGroup | null;
  rating: number | null;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  tackleAttempts: number;
  /** Dos contadores de eventos da EA; null em partidas salvas antes de 26/10/2026. */
  interceptions: number | null;
  /** Pré-assistências (o passe para quem deu a assistência); null como interceptions. */
  secondAssists: number | null;
  /** Tipos de gol; null como interceptions. */
  goalTypes: GoalTypes | null;
  /** Não disponível na resposta atual da EA. */
  yellowCards: number | null;
  redCards: number;
  saves: number;
  manOfTheMatch: boolean;
  secondsPlayed: number | null;
}

/** Estatísticas de um jogador do clube em uma partida, vindas da fonte externa. */
export interface PlayerMatchSnapshot extends PlayerMatchStatsValues {
  eaPlayerId: string;
  name: string;
  /** Contadores crus {código: quantidade}, guardados para decodificar depois. */
  eventCounts: Record<string, number> | null;
}

export interface MatchOpponent {
  eaClubId: number | null;
  name: string;
  crestUrl: string | null;
}

/** Partida vinda de fonte externa, do ponto de vista de um clube. */
export interface MatchSnapshot {
  eaMatchId: string | null;
  matchType: MatchType;
  playedAt: string;
  opponent: MatchOpponent;
  goalsFor: number;
  goalsAgainst: number;
  result: MatchResult;
  decidedByDnf: boolean;
  clubStats: TeamMatchStats | null;
  opponentStats: TeamMatchStats | null;
  players: PlayerMatchSnapshot[];
}

/** Partida persistida no nosso banco. */
export interface Match {
  id: string;
  clubId: string;
  eaMatchId: string | null;
  matchType: MatchType;
  playedAt: string;
  opponent: MatchOpponent;
  goalsFor: number;
  goalsAgainst: number;
  result: MatchResult;
  decidedByDnf: boolean;
}

export interface MatchPlayerStats extends PlayerMatchStatsValues {
  playerId: string;
  playerName: string;
  proName: string | null;
}

export interface MatchDetails extends Match {
  clubStats: TeamMatchStats | null;
  opponentStats: TeamMatchStats | null;
  players: MatchPlayerStats[];
}

/** Uma partida do histórico vista pelo lado de um jogador. */
export interface PlayerMatchEntry {
  match: Match;
  stats: PlayerMatchStatsValues;
}

/** Estatística de um jogador numa partida, com o nome — base de recordes e duplas. */
export interface ClubPlayerMatchStat {
  matchId: string;
  playerId: string;
  playerName: string;
  stats: PlayerMatchStatsValues;
}
