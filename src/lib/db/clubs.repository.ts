import "server-only";

import { PLATFORMS, type Club, type ClubSnapshot, type Platform } from "@/types/club";
import type { TableRow } from "@/types/database";

import { getDbAdmin, getDbReader } from "./client";
import { parseEnum } from "./enums";
import { unwrap, unwrapMaybe } from "./errors";

function mapClubRow(row: TableRow<"clubs">): Club {
  return {
    id: row.id,
    eaClubId: row.ea_club_id,
    platform: parseEnum(PLATFORMS, row.platform, "crossplay"),
    name: row.name,
    crestUrl: row.crest_url,
    regionId: row.ea_region_id,
    skillRating: row.skill_rating,
    record: {
      gamesPlayed: row.games_played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
    },
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Cria ou atualiza o clube (chave natural: ea_club_id + platform). */
export async function upsertClub(snapshot: ClubSnapshot, syncedAt: string): Promise<Club> {
  const row = unwrap(
    await getDbAdmin()
      .from("clubs")
      .upsert(
        {
          ea_club_id: snapshot.eaClubId,
          platform: snapshot.platform,
          name: snapshot.name,
          crest_url: snapshot.crestUrl,
          ea_region_id: snapshot.regionId,
          skill_rating: snapshot.skillRating,
          games_played: snapshot.record.gamesPlayed,
          wins: snapshot.record.wins,
          draws: snapshot.record.draws,
          losses: snapshot.record.losses,
          goals_for: snapshot.record.goalsFor,
          goals_against: snapshot.record.goalsAgainst,
          last_synced_at: syncedAt,
        },
        { onConflict: "ea_club_id,platform" },
      )
      .select()
      .single(),
    "salvar clube",
  );
  return mapClubRow(row);
}

export async function getClubById(id: string): Promise<Club | null> {
  const row = unwrapMaybe(
    await getDbReader().from("clubs").select().eq("id", id).maybeSingle(),
    "buscar clube",
  );
  return row ? mapClubRow(row) : null;
}

export async function findClubByEaId(
  eaClubId: number,
  platform: Platform,
): Promise<Club | null> {
  const row = unwrapMaybe(
    await getDbReader()
      .from("clubs")
      .select()
      .eq("ea_club_id", eaClubId)
      .eq("platform", platform)
      .maybeSingle(),
    "buscar clube pelo ID da EA",
  );
  return row ? mapClubRow(row) : null;
}

/** Escapa curingas do LIKE para buscar o termo literalmente. */
const escapeLike = (term: string) => term.replace(/[\\%_]/g, (char) => `\\${char}`);

export async function searchStoredClubs(
  term: string,
  platform: Platform,
  limit = 10,
): Promise<Club[]> {
  const rows = unwrap(
    await getDbReader()
      .from("clubs")
      .select()
      .eq("platform", platform)
      .ilike("name", `%${escapeLike(term)}%`)
      .order("last_synced_at", { ascending: false, nullsFirst: false })
      .limit(limit),
    "buscar clubes salvos",
  );
  return rows.map(mapClubRow);
}

export async function listRecentlySyncedClubs(limit = 6): Promise<Club[]> {
  const rows = unwrap(
    await getDbReader()
      .from("clubs")
      .select()
      .not("last_synced_at", "is", null)
      .order("last_synced_at", { ascending: false })
      .limit(limit),
    "listar clubes recentes",
  );
  return rows.map(mapClubRow);
}

/** Clubes com sincronização mais antiga primeiro (usado pelo cron). */
export async function listClubsDueForSync(
  syncedBefore: string,
  limit: number,
): Promise<Club[]> {
  const rows = unwrap(
    await getDbAdmin()
      .from("clubs")
      .select()
      .or(`last_synced_at.is.null,last_synced_at.lt."${syncedBefore}"`)
      .order("last_synced_at", { ascending: true, nullsFirst: true })
      .limit(limit),
    "listar clubes para sincronizar",
  );
  return rows.map(mapClubRow);
}
