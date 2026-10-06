import "server-only";

import type { TableRow } from "@/types/database";
import type { Formation, FormationInput, FormationSlot } from "@/types/formation";

import { getDbAdmin, getDbReader } from "./client";
import { assertOk, unwrap, unwrapMaybe } from "./errors";

const FORMATION_SELECT = "*, formation_players(*, players(name))";

type SlotRow = TableRow<"formation_players"> & { players: { name: string } | null };
type FormationRow = TableRow<"formations"> & { formation_players: SlotRow[] };

function mapSlotRow(row: SlotRow): FormationSlot {
  return {
    slotIndex: row.slot_index,
    position: row.position,
    x: row.x_position,
    y: row.y_position,
    playerId: row.player_id,
    playerName: row.players?.name ?? null,
    archetype: row.archetype,
    strengths: row.strengths,
    notes: row.notes,
  };
}

function mapFormationRow(row: FormationRow): Formation {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    formationType: row.formation_type,
    roles: {
      captain: row.captain_id,
      penalties: row.penalty_taker_id,
      freeKicks: row.free_kick_taker_id,
      corners: row.corner_taker_id,
    },
    gameCode: row.game_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slots: row.formation_players.map(mapSlotRow).sort((a, b) => a.slotIndex - b.slotIndex),
  };
}

export async function listFormationsByClub(clubId: string): Promise<Formation[]> {
  const rows = unwrap(
    await getDbReader()
      .from("formations")
      .select(FORMATION_SELECT)
      .eq("club_id", clubId)
      .order("updated_at", { ascending: false }),
    "listar formações",
  );
  return rows.map(mapFormationRow);
}

export async function getFormation(clubId: string, formationId: string): Promise<Formation | null> {
  const row = unwrapMaybe(
    await getDbReader()
      .from("formations")
      .select(FORMATION_SELECT)
      .eq("id", formationId)
      .eq("club_id", clubId)
      .maybeSingle(),
    "buscar formação",
  );
  return row ? mapFormationRow(row) : null;
}

async function upsertFormationRecord(input: FormationInput): Promise<string | null> {
  const db = getDbAdmin();
  const values = {
    name: input.name,
    formation_type: input.formationType,
    captain_id: input.roles.captain,
    penalty_taker_id: input.roles.penalties,
    free_kick_taker_id: input.roles.freeKicks,
    corner_taker_id: input.roles.corners,
    game_code: input.gameCode,
  };

  if (input.formationId) {
    const updated = unwrapMaybe(
      await db
        .from("formations")
        .update(values)
        .eq("id", input.formationId)
        .eq("club_id", input.clubId)
        .select("id")
        .maybeSingle(),
      "atualizar formação",
    );
    return updated?.id ?? null;
  }

  const created = unwrap(
    await db
      .from("formations")
      .insert({ ...values, club_id: input.clubId })
      .select("id")
      .single(),
    "criar formação",
  );
  return created.id;
}

/**
 * Cria ou atualiza a formação e grava as 11 vagas (upsert por vaga).
 * Retorna o id, ou null se a formação não existir neste clube.
 */
export async function saveFormation(input: FormationInput): Promise<string | null> {
  const formationId = await upsertFormationRecord(input);
  if (!formationId) return null;

  assertOk(
    await getDbAdmin()
      .from("formation_players")
      .upsert(
        input.slots.map((slot) => ({
          formation_id: formationId,
          slot_index: slot.slotIndex,
          position: slot.position,
          x_position: slot.x,
          y_position: slot.y,
          player_id: slot.playerId,
          archetype: slot.archetype,
          strengths: slot.strengths,
          notes: slot.notes,
        })),
        { onConflict: "formation_id,slot_index" },
      ),
    "salvar vagas da formação",
  );
  return formationId;
}

export async function deleteFormation(clubId: string, formationId: string): Promise<void> {
  assertOk(
    await getDbAdmin().from("formations").delete().eq("id", formationId).eq("club_id", clubId),
    "apagar formação",
  );
}
