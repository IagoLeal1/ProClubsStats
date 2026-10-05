import "server-only";

import { createHash } from "node:crypto";

import {
  findExistingFingerprints,
  upsertMatches,
  upsertPlayerMatchStats,
  upsertTeamStats,
  type MatchInsert,
  type PlayerMatchStatsInsert,
  type TeamStatsInsert,
} from "@/lib/db/matches.repository";
import { fetchAllRecentMatches } from "@/lib/ea";
import type { Club } from "@/types/club";
import type { MatchSnapshot, MatchType, TeamMatchStats } from "@/types/match";

import { resolveMatchPlayers, type MatchPlayerRef } from "./player-sync.service";

export interface MatchSyncResult {
  /** Partidas recebidas da EA nesta sincronização. */
  fetched: number;
  /** Partidas que ainda não existiam no banco. */
  newMatches: number;
  /** Partidas ignoradas por formato inesperado. */
  skipped: number;
  /** Tipos de partida cuja busca falhou (dados parciais). */
  failedTypes: MatchType[];
  /** Jogadores cujas estatísticas não puderam ser associadas. */
  unresolvedPlayers: number;
}

/**
 * Chave de deduplicação da partida para um clube.
 * Usa o matchId da EA; sem ele, um hash de clube + adversário + data + placar.
 */
export function buildMatchFingerprint(eaClubId: number, match: MatchSnapshot): string {
  if (match.eaMatchId) return `ea:${match.eaMatchId}`;

  const parts = [
    eaClubId,
    match.opponent.eaClubId ?? match.opponent.name,
    match.playedAt,
    `${match.goalsFor}-${match.goalsAgainst}`,
  ];
  return `fp:${createHash("sha256").update(parts.join("|")).digest("hex")}`;
}

function toMatchRow(clubId: string, fingerprint: string, match: MatchSnapshot): MatchInsert {
  return {
    club_id: clubId,
    ea_match_id: match.eaMatchId,
    fingerprint,
    match_type: match.matchType,
    played_at: match.playedAt,
    opponent_ea_club_id: match.opponent.eaClubId,
    opponent_name: match.opponent.name,
    opponent_crest_url: match.opponent.crestUrl,
    goals_for: match.goalsFor,
    goals_against: match.goalsAgainst,
    result: match.result,
    decided_by_dnf: match.decidedByDnf,
  };
}

function toTeamStatsRow(
  matchId: string,
  side: "club" | "opponent",
  stats: TeamMatchStats,
): TeamStatsInsert {
  return {
    match_id: matchId,
    side,
    goals: stats.goals,
    shots: stats.shots,
    passes: stats.passes,
    passes_completed: stats.passesCompleted,
    tackles: stats.tackles,
    tackle_attempts: stats.tackleAttempts,
    saves: stats.saves,
    red_cards: stats.redCards,
  };
}

function buildTeamStatsRows(
  matches: Map<string, MatchSnapshot>,
  matchIds: Map<string, string>,
): TeamStatsInsert[] {
  const rows: TeamStatsInsert[] = [];
  for (const [fingerprint, match] of matches) {
    const matchId = matchIds.get(fingerprint);
    if (!matchId) continue;
    if (match.clubStats) rows.push(toTeamStatsRow(matchId, "club", match.clubStats));
    if (match.opponentStats) rows.push(toTeamStatsRow(matchId, "opponent", match.opponentStats));
  }
  return rows;
}

function collectPlayerRefs(matches: Iterable<MatchSnapshot>): MatchPlayerRef[] {
  const refs = new Map<string, MatchPlayerRef>();
  for (const match of matches) {
    for (const player of match.players) {
      refs.set(player.eaPlayerId, { eaPlayerId: player.eaPlayerId, name: player.name });
    }
  }
  return [...refs.values()];
}

function buildPlayerStatsRows(
  matches: Map<string, MatchSnapshot>,
  matchIds: Map<string, string>,
  playerIds: Map<string, string>,
): PlayerMatchStatsInsert[] {
  const rows = new Map<string, PlayerMatchStatsInsert>();

  for (const [fingerprint, match] of matches) {
    const matchId = matchIds.get(fingerprint);
    if (!matchId) continue;

    for (const stats of match.players) {
      const playerId = playerIds.get(stats.eaPlayerId);
      if (!playerId) continue;

      rows.set(`${matchId}:${playerId}`, {
        match_id: matchId,
        player_id: playerId,
        position: stats.position,
        rating: stats.rating,
        goals: stats.goals,
        assists: stats.assists,
        shots: stats.shots,
        passes: stats.passes,
        passes_completed: stats.passesCompleted,
        tackles: stats.tackles,
        tackle_attempts: stats.tackleAttempts,
        interceptions: stats.interceptions,
        yellow_cards: stats.yellowCards,
        red_cards: stats.redCards,
        saves: stats.saves,
        man_of_the_match: stats.manOfTheMatch,
        seconds_played: stats.secondsPlayed,
      });
    }
  }
  return [...rows.values()];
}

/**
 * Busca as partidas recentes na EA e salva as novas (as antigas nunca são
 * apagadas). Tudo é upsert por chave natural, então rodar de novo não duplica.
 * Pressupõe que os membros já foram sincronizados (para vincular jogadores).
 */
export async function syncClubMatches(club: Club): Promise<MatchSyncResult> {
  const { matches, skipped, failures } = await fetchAllRecentMatches(
    club.eaClubId,
    club.platform,
  );

  const firstFailure = failures[0];
  if (matches.length === 0 && firstFailure) throw firstFailure.error;

  // Um upsert não pode tocar a mesma linha duas vezes: deduplicar antes.
  const byFingerprint = new Map<string, MatchSnapshot>();
  for (const match of matches) {
    byFingerprint.set(buildMatchFingerprint(club.eaClubId, match), match);
  }
  const fingerprints = [...byFingerprint.keys()];

  const existing = await findExistingFingerprints(club.id, fingerprints);
  const matchIds = await upsertMatches(
    [...byFingerprint].map(([fingerprint, match]) => toMatchRow(club.id, fingerprint, match)),
  );

  await upsertTeamStats(buildTeamStatsRows(byFingerprint, matchIds));

  const players = await resolveMatchPlayers(club.id, collectPlayerRefs(byFingerprint.values()));
  await upsertPlayerMatchStats(
    buildPlayerStatsRows(byFingerprint, matchIds, players.idsByEaPlayerId),
  );

  return {
    fetched: byFingerprint.size,
    newMatches: fingerprints.filter((fingerprint) => !existing.has(fingerprint)).length,
    skipped,
    failedTypes: failures.map((failure) => failure.matchType),
    unresolvedPlayers: players.unresolved.length,
  };
}
