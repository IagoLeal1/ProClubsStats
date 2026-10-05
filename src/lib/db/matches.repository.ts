import "server-only";

import type { TableInsert, TableRow } from "@/types/database";
import {
  MATCH_TYPES,
  type Match,
  type MatchDetails,
  type MatchPlayerStats,
  type MatchResult,
  type TeamMatchStats,
} from "@/types/match";
import { POSITION_GROUPS } from "@/types/player";

import { getDbAdmin, getDbReader } from "./client";
import { parseEnum, parseEnumOrNull } from "./enums";
import { assertOk, unwrap, unwrapMaybe } from "./errors";

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

export async function listMatchesPage(
  clubId: string,
  page: number,
  pageSize: number,
): Promise<{ matches: Match[]; total: number }> {
  const db = getDbReader();
  const from = (page - 1) * pageSize;
  const response = await db
    .from("matches")
    .select("*", { count: "exact" })
    .eq("club_id", clubId)
    .order("played_at", { ascending: false })
    .range(from, from + pageSize - 1);

  // Página além do fim: o PostgREST responde 416 (PGRST103) em vez de lista vazia.
  if (response.error?.code === "PGRST103") {
    const { count, error } = await db
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId);
    assertOk({ error }, "contar partidas");
    return { matches: [], total: count ?? 0 };
  }

  const rows = unwrap(response, "listar partidas");
  return { matches: rows.map(mapMatchRow), total: response.count ?? rows.length };
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

  const players: MatchPlayerStats[] = playerStatsRows.map((stats) => ({
    playerId: stats.player_id,
    playerName: stats.players?.name ?? "Jogador",
    proName: stats.players?.pro_name ?? null,
    position: parseEnumOrNull(POSITION_GROUPS, stats.position),
    rating: stats.rating,
    goals: stats.goals,
    assists: stats.assists,
    shots: stats.shots,
    passes: stats.passes,
    passesCompleted: stats.passes_completed,
    tackles: stats.tackles,
    tackleAttempts: stats.tackle_attempts,
    interceptions: stats.interceptions,
    yellowCards: stats.yellow_cards,
    redCards: stats.red_cards,
    saves: stats.saves,
    manOfTheMatch: stats.man_of_the_match,
    secondsPlayed: stats.seconds_played,
  }));

  return {
    ...mapMatchRow(row),
    clubStats: statsFor("club"),
    opponentStats: statsFor("opponent"),
    players,
  };
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
