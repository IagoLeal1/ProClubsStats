import type {
  ClubRecord,
  ClubSearchResult,
  ClubSnapshot,
  Platform,
} from "@/types/club";
import type {
  MatchResult,
  MatchSnapshot,
  MatchType,
  PlayerMatchSnapshot,
  TeamMatchStats,
} from "@/types/match";
import {
  POSITION_GROUPS,
  type PlayerSnapshot,
  type PositionGroup,
} from "@/types/player";

import { EA_CREST_BASE_URL } from "./constants";
import { positionLabelFromCode } from "./positions";
import type {
  EAClubDetails,
  EAClubOverallStats,
  EALeaderboardEntry,
  EAMatch,
  EAMatchAggregate,
  EAMatchClub,
  EAMatchPlayer,
  EAMember,
} from "./types";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** A EA preenche nomes com espaços extras ("REAL   MADRID"). */
function normalizeName(name: string | null | undefined): string | null {
  const normalized = name?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
}

function crestUrlFrom(details: EAClubDetails | null | undefined): string | null {
  const assetId = details?.customKit?.crestAssetId;
  return assetId && /^\d+$/.test(assetId) ? `${EA_CREST_BASE_URL}${assetId}.png` : null;
}

function toPositionGroup(value: string | null): PositionGroup | null {
  const normalized = value?.toLowerCase();
  return POSITION_GROUPS.find((group) => group === normalized) ?? null;
}

const count = (value: number | null) => value ?? 0;

/** Taxas e notas "0" para quem não jogou não significam nada: viram null. */
function rateOrNull(value: number | null, gamesPlayed: number): number | null {
  return gamesPlayed > 0 ? value : null;
}

function resultFromScore(goalsFor: number, goalsAgainst: number): MatchResult {
  if (goalsFor > goalsAgainst) return "W";
  if (goalsFor < goalsAgainst) return "L";
  return "D";
}

/**
 * Em partidas competitivas a EA informa wins/losses/ties (inclui vitória por
 * abandono). Em amistosos esses campos vêm zerados: usamos o placar.
 */
function resolveResult(
  club: EAMatchClub,
  goalsFor: number,
  goalsAgainst: number,
): MatchResult {
  if (count(club.wins) > 0) return "W";
  if (count(club.losses) > 0) return "L";
  if (count(club.ties) > 0) return "D";
  return resultFromScore(goalsFor, goalsAgainst);
}

// -----------------------------------------------------------------------------
// Clube
// -----------------------------------------------------------------------------

function mapRecord(stats: {
  gamesPlayed: number | null;
  wins: number | null;
  ties: number | null;
  losses: number | null;
  goals: number | null;
  goalsAgainst: number | null;
}): ClubRecord {
  return {
    gamesPlayed: count(stats.gamesPlayed),
    wins: count(stats.wins),
    draws: count(stats.ties),
    losses: count(stats.losses),
    goalsFor: count(stats.goals),
    goalsAgainst: count(stats.goalsAgainst),
  };
}

const EMPTY_RECORD: ClubRecord = {
  gamesPlayed: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
};

export function mapEAClubSearchResult(
  entry: EALeaderboardEntry,
  platform: Platform,
): ClubSearchResult | null {
  const eaClubId = entry.clubId ?? entry.clubInfo?.clubId ?? null;
  const name = normalizeName(entry.clubInfo?.name) ?? normalizeName(entry.clubName);
  if (eaClubId === null || name === null) return null;

  return {
    eaClubId,
    platform,
    name,
    crestUrl: crestUrlFrom(entry.clubInfo),
    record: mapRecord(entry),
  };
}

/**
 * EAClubDetails (+ estatísticas gerais, quando existirem) → ClubSnapshot.
 * Um clube sem partidas não aparece em /clubs/overallStats: recorde zerado.
 */
export function mapEAClub(
  eaClubId: number,
  platform: Platform,
  details: EAClubDetails,
  overall: EAClubOverallStats | null,
): ClubSnapshot {
  return {
    eaClubId,
    platform,
    name: normalizeName(details.name) ?? `Clube ${eaClubId}`,
    crestUrl: crestUrlFrom(details),
    regionId: details.regionId,
    skillRating: overall?.skillRating ?? null,
    record: overall ? mapRecord(overall) : EMPTY_RECORD,
  };
}

export function mapEAClubInfoToSearchResult(
  eaClubId: number,
  platform: Platform,
  details: EAClubDetails,
): ClubSearchResult {
  return {
    eaClubId,
    platform,
    name: normalizeName(details.name) ?? `Clube ${eaClubId}`,
    crestUrl: crestUrlFrom(details),
    record: null,
  };
}

// -----------------------------------------------------------------------------
// Jogadores
// -----------------------------------------------------------------------------

export function mapEAMember(member: EAMember): PlayerSnapshot | null {
  const name = member.name?.trim();
  if (!name) return null;

  const gamesPlayed = count(member.gamesPlayed);

  return {
    name,
    proName: normalizeName(member.proName),
    position: positionLabelFromCode(member.proPos),
    positionCode: member.proPos,
    favoritePosition: toPositionGroup(member.favoritePosition),
    overall: member.proOverall,
    stats: {
      gamesPlayed,
      goals: count(member.goals),
      assists: count(member.assists),
      averageRating: rateOrNull(member.ratingAve, gamesPlayed),
      passesMade: count(member.passesMade),
      passSuccessRate: rateOrNull(member.passSuccessRate, gamesPlayed),
      tacklesMade: count(member.tacklesMade),
      tackleSuccessRate: rateOrNull(member.tackleSuccessRate, gamesPlayed),
      shotSuccessRate: rateOrNull(member.shotSuccessRate, gamesPlayed),
      winRate: rateOrNull(member.winRate, gamesPlayed),
      manOfTheMatch: count(member.manOfTheMatch),
      redCards: count(member.redCards),
    },
  };
}

// -----------------------------------------------------------------------------
// Partidas
// -----------------------------------------------------------------------------

function mapAggregate(
  aggregate: EAMatchAggregate | null | undefined,
  goals: number,
): TeamMatchStats | null {
  if (!aggregate) return null;
  return {
    goals,
    shots: count(aggregate.shots),
    passes: count(aggregate.passattempts),
    passesCompleted: count(aggregate.passesmade),
    tackles: count(aggregate.tacklesmade),
    tackleAttempts: count(aggregate.tackleattempts),
    saves: count(aggregate.saves),
    redCards: count(aggregate.redcards),
  };
}

function mapEAMatchPlayer(
  eaPlayerId: string,
  player: EAMatchPlayer,
): PlayerMatchSnapshot | null {
  const name = player.playername?.trim();
  if (!name) return null;

  return {
    eaPlayerId,
    name,
    position: toPositionGroup(player.pos),
    rating: player.rating,
    goals: count(player.goals),
    assists: count(player.assists),
    shots: count(player.shots),
    passes: count(player.passattempts),
    passesCompleted: count(player.passesmade),
    tackles: count(player.tacklesmade),
    tackleAttempts: count(player.tackleattempts),
    // TODO(ea): não há campo dedicado para interceptações nem cartões amarelos
    // na resposta atual. Podem estar codificados em match_event_aggregate_*,
    // cujo significado não é documentado — não inferir.
    interceptions: null,
    yellowCards: null,
    redCards: count(player.redcards),
    saves: count(player.saves),
    manOfTheMatch: count(player.mom) > 0,
    secondsPlayed: player.secondsPlayed,
  };
}

/**
 * Partida da EA → MatchSnapshot do ponto de vista de `eaClubId`.
 * Retorna null quando faltam dados essenciais (clube, placar ou data).
 */
export function mapEAMatch(
  match: EAMatch,
  eaClubId: number,
  matchType: MatchType,
): MatchSnapshot | null {
  const clubKey = String(eaClubId);
  const club = match.clubs[clubKey];
  if (!club || match.timestamp === null) return null;

  const opponentKey = Object.keys(match.clubs).find((key) => key !== clubKey) ?? null;
  const opponent = opponentKey ? match.clubs[opponentKey] : undefined;

  const goalsFor = club.goals ?? club.score;
  const goalsAgainst = club.goalsAgainst ?? opponent?.goals ?? null;
  if (goalsFor === null || goalsAgainst === null) return null;

  const opponentEaClubId = opponentKey !== null ? Number(opponentKey) : null;
  const ourPlayers = match.players?.[clubKey] ?? {};

  return {
    eaMatchId: match.matchId,
    matchType,
    playedAt: new Date(match.timestamp * 1000).toISOString(),
    opponent: {
      eaClubId: Number.isFinite(opponentEaClubId) ? opponentEaClubId : null,
      name: normalizeName(opponent?.details?.name) ?? "Adversário desconhecido",
      crestUrl: crestUrlFrom(opponent?.details),
    },
    goalsFor,
    goalsAgainst,
    result: resolveResult(club, goalsFor, goalsAgainst),
    decidedByDnf: count(club.winnerByDnf) > 0 || count(opponent?.winnerByDnf ?? null) > 0,
    clubStats: mapAggregate(match.aggregate?.[clubKey], goalsFor),
    opponentStats: opponentKey
      ? mapAggregate(match.aggregate?.[opponentKey], goalsAgainst)
      : null,
    players: Object.entries(ourPlayers)
      .map(([eaPlayerId, player]) => mapEAMatchPlayer(eaPlayerId, player))
      .filter((player): player is PlayerMatchSnapshot => player !== null),
  };
}
