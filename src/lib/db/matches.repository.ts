import "server-only";

import type { TableInsert, TableRow } from "@/types/database";
import {
  MATCH_TYPES,
  type ClubPlayerMatchStat,
  type Match,
  type MatchDetails,
  type MatchPlayerStats,
  type MatchResult,
  type PlayerMatchEntry,
  type PlayerMatchStatsValues,
  type TeamMatchStats,
} from "@/types/match";
import { POSITION_GROUPS } from "@/types/player";

import { getDbAdmin, getDbReader } from "./client";
import { parseEnum, parseEnumOrNull } from "./enums";
import { assertOk, fetchAllPages, unwrap, unwrapMaybe } from "./errors";

const MATCH_RESULTS: readonly MatchResult[] = ["W", "D", "L"];

export type MatchInsert = TableInsert<"matches">;
export type TeamStatsInsert = TableInsert<"match_team_stats">;
export type PlayerMatchStatsInsert = TableInsert<"player_match_stats">;

function mapMatchRow(row: TableRow<"matches">): Match {
  return {
    id: row.id,
    clubId: row.club_id,
    eaMatchId: row.ea_match_id,
    matchType: parseEnum(MATCH_TYPES, row.match_type, "league"),
    playedAt: row.played_at,
    opponent: {
      eaClubId: row.opponent_ea_club_id,
      name: row.opponent_name,
      crestUrl: row.opponent_crest_url,
    },
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    result: parseEnum(MATCH_RESULTS, row.result, "D"),
    decidedByDnf: row.decided_by_dnf,
  };
}

function mapPlayerStatsValues(row: TableRow<"player_match_stats">): PlayerMatchStatsValues {
  return {
    position: parseEnumOrNull(POSITION_GROUPS, row.position),
    rating: row.rating,
    goals: row.goals,
    assists: row.assists,
    shots: row.shots,
    passes: row.passes,
    passesCompleted: row.passes_completed,
    tackles: row.tackles,
    tackleAttempts: row.tackle_attempts,
    interceptions: row.interceptions,
    yellowCards: row.yellow_cards,
    redCards: row.red_cards,
    saves: row.saves,
    manOfTheMatch: row.man_of_the_match,
    secondsPlayed: row.seconds_played,
  };
}

function mapTeamStatsRow(row: TableRow<"match_team_stats">): TeamMatchStats {
  return {
    goals: row.goals,
    shots: row.shots,
    passes: row.passes,
    passesCompleted: row.passes_completed,
    tackles: row.tackles,
    tackleAttempts: row.tackle_attempts,
    saves: row.saves,
    redCards: row.red_cards,
  };
}

// -----------------------------------------------------------------------------
// Leitura
// -----------------------------------------------------------------------------

export async function listRecentMatches(clubId: string, limit: number): Promise<Match[]> {
  const rows = unwrap(
    await getDbReader()
      .from("matches")
      .select()
      .eq("club_id", clubId)
      .order("played_at", { ascending: false })
      .limit(limit),
    "listar partidas recentes",
  );
  return rows.map(mapMatchRow);
}

export async function getMatchDetails(
  clubId: string,
  matchId: string,
): Promise<MatchDetails | null> {
  const db = getDbReader();

  const row = unwrapMaybe(
    await db.from("matches").select().eq("id", matchId).eq("club_id", clubId).maybeSingle(),
    "buscar partida",
  );
  if (!row) return null;

  const [teamStatsRows, playerStatsRows] = await Promise.all([
    db.from("match_team_stats").select().eq("match_id", matchId),
    db
      .from("player_match_stats")
      .select("*, players(name, pro_name)")
      .eq("match_id", matchId)
      .order("rating", { ascending: false, nullsFirst: false }),
  ]).then(([teamStats, playerStats]) => [
    unwrap(teamStats, "buscar estatísticas da partida"),
    unwrap(playerStats, "buscar estatísticas dos jogadores"),
  ] as const);

  const statsFor = (side: "club" | "opponent") => {
    const statsRow = teamStatsRows.find((stats) => stats.side === side);
    return statsRow ? mapTeamStatsRow(statsRow) : null;
  };

  const players: MatchPlayerStats[] = playerStatsRows.map(({ players: player, ...stats }) => ({
    ...mapPlayerStatsValues(stats),
    playerId: stats.player_id,
    playerName: player?.name ?? "Jogador",
    proName: player?.pro_name ?? null,
  }));

  return {
    ...mapMatchRow(row),
    clubStats: statsFor("club"),
    opponentStats: statsFor("opponent"),
    players,
  };
}

/** Todas as partidas salvas de um jogador, da mais recente para a mais antiga. */
export async function listPlayerMatchHistory(playerId: string): Promise<PlayerMatchEntry[]> {
  const rows = await fetchAllPages(
    (from, to) =>
      getDbReader()
        .from("player_match_stats")
        .select("*, matches(*)")
        .eq("player_id", playerId)
        .order("id")
        .range(from, to),
    "buscar histórico do jogador",
  );

  return rows
    .flatMap(({ matches: match, ...stats }) =>
      match ? [{ match: mapMatchRow(match), stats: mapPlayerStatsValues(stats) }] : [],
    )
    .sort((a, b) => b.match.playedAt.localeCompare(a.match.playedAt));
}

/** Todas as partidas salvas do clube, da mais antiga para a mais recente. */
export async function listAllClubMatches(clubId: string): Promise<Match[]> {
  const rows = await fetchAllPages(
    (from, to) =>
      getDbReader()
        .from("matches")
        .select()
        .eq("club_id", clubId)
        .order("played_at", { ascending: true })
        .order("id")
        .range(from, to),
    "listar todas as partidas",
  );
  return rows.map(mapMatchRow);
}

/** Estatísticas individuais de todas as partidas salvas do clube. */
export async function listClubPlayerMatchStats(clubId: string): Promise<ClubPlayerMatchStat[]> {
  const rows = await fetchAllPages(
    (from, to) =>
      getDbReader()
        .from("player_match_stats")
        .select("*, players(name), matches!inner(club_id)")
        .eq("matches.club_id", clubId)
        .order("id")
        .range(from, to),
    "listar estatísticas individuais do clube",
  );
  return rows.map((row) => ({
    matchId: row.match_id,
    playerId: row.player_id,
    playerName: row.players?.name ?? "Jogador",
    stats: mapPlayerStatsValues(row),
  }));
}

// -----------------------------------------------------------------------------
// Escrita (sincronização)
// -----------------------------------------------------------------------------

export async function findExistingFingerprints(
  clubId: string,
  fingerprints: string[],
): Promise<Set<string>> {
  if (fingerprints.length === 0) return new Set();
  const rows = unwrap(
    await getDbAdmin()
      .from("matches")
      .select("fingerprint")
      .eq("club_id", clubId)
      .in("fingerprint", fingerprints),
    "verificar partidas existentes",
  );
  return new Set(rows.map((row) => row.fingerprint));
}

/** Upsert por (club_id, fingerprint). Retorna fingerprint → id da partida. */
export async function upsertMatches(rows: MatchInsert[]): Promise<Map<string, string>> {
  if (rows.length === 0) return new Map();
  const saved = unwrap(
    await getDbAdmin()
      .from("matches")
      .upsert(rows, { onConflict: "club_id,fingerprint" })
      .select("id, fingerprint"),
    "salvar partidas",
  );
  return new Map(saved.map((row) => [row.fingerprint, row.id]));
}

export async function upsertTeamStats(rows: TeamStatsInsert[]): Promise<void> {
  if (rows.length === 0) return;
  assertOk(
    await getDbAdmin()
      .from("match_team_stats")
      .upsert(rows, { onConflict: "match_id,side" }),
    "salvar estatísticas das equipes",
  );
}

export async function upsertPlayerMatchStats(rows: PlayerMatchStatsInsert[]): Promise<void> {
  if (rows.length === 0) return;
  assertOk(
    await getDbAdmin()
      .from("player_match_stats")
      .upsert(rows, { onConflict: "match_id,player_id" }),
    "salvar estatísticas individuais",
  );
}
