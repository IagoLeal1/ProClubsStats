import "server-only";

import type { TableRow } from "@/types/database";
import { POSITION_GROUPS, type Player, type PlayerSnapshot } from "@/types/player";

import { getDbAdmin, getDbReader } from "./client";
import { parseEnumOrNull } from "./enums";
import { assertOk, unwrap } from "./errors";

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
export async function upsertMemberSnapshots(
  clubId: string,
  members: PlayerSnapshot[],
  syncedAt: string,
): Promise<void> {
  if (members.length === 0) return;

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

  assertOk(
    await getDbAdmin().from("players").upsert(rows, { onConflict: "club_id,name" }),
    "salvar jogadores",
  );
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
