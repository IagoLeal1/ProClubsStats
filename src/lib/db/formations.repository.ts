import "server-only";

import type { Formation } from "@/types/formation";

import { getDbReader } from "./client";
import { unwrap } from "./errors";

export async function listFormationsByClub(clubId: string): Promise<Formation[]> {
  const rows = unwrap(
    await getDbReader()
      .from("formations")
      .select("*, formation_players(*, players(name))")
      .eq("club_id", clubId)
      .order("updated_at", { ascending: false }),
    "listar formações",
  );

  return rows.map((row) => ({
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    formationType: row.formation_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    players: row.formation_players.map((formationPlayer) => ({
      id: formationPlayer.id,
      playerId: formationPlayer.player_id,
      playerName: formationPlayer.players?.name ?? "Jogador",
      position: formationPlayer.position,
      x: formationPlayer.x_position,
      y: formationPlayer.y_position,
    })),
  }));
}
