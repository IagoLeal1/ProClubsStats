import "server-only";

import type { TableRow } from "@/types/database";
import { POSITION_GROUPS, type Player, type PlayerProgressPoint, type PlayerSnapshot } from "@/types/player";

import { getDbAdmin, getDbReader } from "./client";
import { parseEnumOrNull } from "./enums";
import { assertOk, fetchAllPages, unwrap, unwrapMaybe } from "./errors";

export interface PlayerIdentity {
  id: string;
  name: string;
  eaPlayerId: string | null;
  isMember: boolean;
}

function mapPlayerRow(row: TableRow<"players">): Player {
  return {
    id: row.id,
    clubId: row.club_id,
    eaPlayerId: row.ea_player_id,
    name: row.name,
    proName: row.pro_name,
    position: row.position,
    positionCode: row.ea_position_code,
    favoritePosition: parseEnumOrNull(POSITION_GROUPS, row.favorite_position),
    overall: row.overall,
    isMember: row.is_member,
    lastSyncedAt: row.last_synced_at,
    stats: {
      gamesPlayed: row.games_played,
      goals: row.goals,
      assists: row.assists,
      averageRating: row.average_rating,
      passesMade: row.passes_made,
      passSuccessRate: row.pass_success_rate,
      tacklesMade: row.tackles_made,
      tackleSuccessRate: row.tackle_success_rate,
      shotSuccessRate: row.shot_success_rate,
      winRate: row.win_rate,
      manOfTheMatch: row.man_of_the_match,
      redCards: row.red_cards,
    },
  };
}

export async function listPlayersByClub(clubId: string): Promise<Player[]> {
  const rows = unwrap(
    await getDbReader()
      .from("players")
      .select()
      .eq("club_id", clubId)
      .order("games_played", { ascending: false })
      .order("name"),
    "listar jogadores",
  );
  return rows.map(mapPlayerRow);
}

export async function getPlayerById(clubId: string, playerId: string): Promise<Player | null> {
  const row = unwrapMaybe(
    await getDbReader()
      .from("players")
      .select()
      .eq("id", playerId)
      .eq("club_id", clubId)
      .maybeSingle(),
    "buscar jogador",
  );
  return row ? mapPlayerRow(row) : null;
}

export async function listPlayerIdentities(clubId: string): Promise<PlayerIdentity[]> {
  const rows = unwrap(
    await getDbAdmin()
      .from("players")
      .select("id, name, ea_player_id, is_member")
      .eq("club_id", clubId),
    "listar identidades de jogadores",
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    eaPlayerId: row.ea_player_id,
    isMember: row.is_member,
  }));
}

/**
 * Atualiza estatísticas dos membros atuais (chave: club_id + name).
 * `ea_player_id` não é enviado, então não é sobrescrito.
 */
/** O que o upsert devolve de cada membro: base para registrar a evolução do OVR. */
export interface SavedMember {
  id: string;
  overall: number | null;
  gamesPlayed: number;
}

export async function upsertMemberSnapshots(
  clubId: string,
  members: PlayerSnapshot[],
  syncedAt: string,
): Promise<SavedMember[]> {
  if (members.length === 0) return [];

  // Um upsert não pode atualizar a mesma linha duas vezes no mesmo comando.
  const uniqueMembers = [...new Map(members.map((member) => [member.name, member])).values()];

  const rows = uniqueMembers.map((member) => ({
    club_id: clubId,
    name: member.name,
    pro_name: member.proName,
    position: member.position,
    ea_position_code: member.positionCode,
    favorite_position: member.favoritePosition,
    overall: member.overall,
    games_played: member.stats.gamesPlayed,
    goals: member.stats.goals,
    assists: member.stats.assists,
    average_rating: member.stats.averageRating,
    passes_made: member.stats.passesMade,
    pass_success_rate: member.stats.passSuccessRate,
    tackles_made: member.stats.tacklesMade,
    tackle_success_rate: member.stats.tackleSuccessRate,
    shot_success_rate: member.stats.shotSuccessRate,
    win_rate: member.stats.winRate,
    man_of_the_match: member.stats.manOfTheMatch,
    red_cards: member.stats.redCards,
    is_member: true,
    last_synced_at: syncedAt,
  }));

  const saved = unwrap(
    await getDbAdmin()
      .from("players")
      .upsert(rows, { onConflict: "club_id,name" })
      .select("id, overall, games_played"),
    "salvar jogadores",
  );
  return saved.map((row) => ({ id: row.id, overall: row.overall, gamesPlayed: row.games_played }));
}

/**
 * Um ponto na evolução do OVR de cada membro por nº de jogos (a EA só informa
 * o OVR atual). Repetir o mesmo nº de jogos não grava de novo.
 */
export async function recordPlayerProgress(members: SavedMember[]): Promise<void> {
  const rows = members.flatMap((member) =>
    member.overall !== null && member.overall > 0
      ? [{ player_id: member.id, overall: member.overall, games_played: member.gamesPlayed }]
      : [],
  );
  if (rows.length === 0) return;
  assertOk(
    await getDbAdmin()
      .from("player_progress")
      .upsert(rows, { onConflict: "player_id,games_played", ignoreDuplicates: true }),
    "registrar evolução dos jogadores",
  );
}

/** Evolução do OVR dos jogadores do clube, do registro mais antigo ao mais recente. */
export async function listClubPlayerProgress(clubId: string): Promise<PlayerProgressPoint[]> {
  const rows = await fetchAllPages((from, to) =>
    getDbReader()
      .from("player_progress")
      .select("player_id, captured_at, overall, games_played, players!inner(club_id)")
      .eq("players.club_id", clubId)
      .order("captured_at", { ascending: true })
      .range(from, to),
    "listar evolução dos jogadores",
  );
  return rows.map((row) => ({
    playerId: row.player_id,
    capturedAt: row.captured_at,
    overall: row.overall,
    gamesPlayed: row.games_played,
  }));
}

/** Jogadores que saíram do clube não são apagados: apenas deixam de ser membros. */
export async function markPlayersAsFormerMembers(playerIds: string[]): Promise<void> {
  if (playerIds.length === 0) return;
  assertOk(
    await getDbAdmin().from("players").update({ is_member: false }).in("id", playerIds),
    "marcar ex-membros",
  );
}

/** Associa o ID numérico da EA (visto nas partidas) a jogadores já salvos. */
export async function linkEaPlayerIds(
  links: { playerId: string; eaPlayerId: string }[],
): Promise<void> {
  for (const link of links) {
    assertOk(
      await getDbAdmin()
        .from("players")
        .update({ ea_player_id: link.eaPlayerId })
        .eq("id", link.playerId),
      "vincular ID EA do jogador",
    );
  }
}

/**
 * Cria jogadores que aparecem nas partidas mas não estão na lista de membros
 * (ex.: saíram do clube). Mantém o histórico de estatísticas por partida.
 */
export async function insertPlayersFromMatches(
  clubId: string,
  players: { name: string; eaPlayerId: string }[],
): Promise<void> {
  if (players.length === 0) return;
  assertOk(
    await getDbAdmin()
      .from("players")
      .upsert(
        players.map((player) => ({
          club_id: clubId,
          name: player.name,
          ea_player_id: player.eaPlayerId,
          is_member: false,
        })),
        { onConflict: "club_id,name", ignoreDuplicates: true },
      ),
    "criar jogadores a partir das partidas",
  );
}
