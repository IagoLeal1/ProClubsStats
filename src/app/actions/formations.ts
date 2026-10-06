"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { deleteFormation, saveFormation } from "@/lib/db/formations.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { getUserMessage, logServerError } from "@/lib/errors";
import { ARCHETYPE_IDS } from "@/lib/formations/archetypes";
import { ATTRIBUTE_IDS, MAX_STRENGTHS } from "@/lib/formations/attributes";
import {
  FIELD_BOUNDS,
  FORMATION_TEMPLATES,
  FORMATION_TYPES,
  formationLabel,
  POSITION_IDS,
  SLOTS_PER_FORMATION,
} from "@/lib/formations/templates";
import type { FormationRoles } from "@/types/formation";

const slotInputSchema = z.object({
  slotIndex: z.number().int().min(0).max(SLOTS_PER_FORMATION - 1),
  position: z.enum(POSITION_IDS),
  x: z.number().min(FIELD_BOUNDS.minX).max(FIELD_BOUNDS.maxX),
  y: z.number().min(0).max(FIELD_BOUNDS.maxY),
  playerId: z.uuid().nullable(),
  archetype: z.enum(ARCHETYPE_IDS).nullable(),
  strengths: z.array(z.enum(ATTRIBUTE_IDS)).max(MAX_STRENGTHS),
  notes: z.string().trim().max(280).nullable(),
});

const rolesSchema = z.object({
  captain: z.uuid().nullable(),
  penalties: z.uuid().nullable(),
  freeKicks: z.uuid().nullable(),
  corners: z.uuid().nullable(),
});

const formationInputSchema = z
  .object({
    clubId: z.uuid(),
    formationId: z.uuid().nullable(),
    name: z.string().trim().min(1, "Dê um nome à formação.").max(60, "Nome muito longo."),
    /** Esquema pronto de partida; null = personalizado. */
    preset: z.enum(FORMATION_TYPES).nullable(),
    slots: z.array(slotInputSchema).length(SLOTS_PER_FORMATION),
    roles: rolesSchema,
  })
  .refine(
    (input) => new Set(input.slots.map((slot) => slot.slotIndex)).size === SLOTS_PER_FORMATION,
    "Vagas repetidas na formação.",
  )
  .refine(
    (input) =>
      input.slots.every((slot) => (slot.slotIndex === 0) === (slot.position === "GOL")) &&
      input.slots.every((slot) => slot.slotIndex === 0 || slot.y >= FIELD_BOUNDS.minY),
    "Só a vaga do goleiro fica no gol.",
  )
  .refine((input) => {
    const players = input.slots.flatMap((slot) => (slot.playerId ? [slot.playerId] : []));
    return new Set(players).size === players.length;
  }, "O mesmo jogador está em duas vagas.")
  .refine((input) => {
    const lineup = new Set(input.slots.map((slot) => slot.playerId));
    return Object.values(input.roles).every((playerId) => playerId === null || lineup.has(playerId));
  }, "Capitão e cobradores precisam estar escalados.");

/** O que o navegador envia. Não confiável: tudo é validado pelo schema acima. */
export interface FormationInputPayload {
  clubId: string;
  formationId: string | null;
  name: string;
  preset: string | null;
  slots: {
    slotIndex: number;
    position: string;
    x: number;
    y: number;
    playerId: string | null;
    archetype: string | null;
    strengths: string[];
    notes: string | null;
  }[];
  roles: FormationRoles;
}

export type SaveFormationState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "saved"; savedAt: string };

export async function saveFormationAction(
  _previous: SaveFormationState,
  payload: FormationInputPayload,
): Promise<SaveFormationState> {
  const parsed = formationInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const input = parsed.data;
  // O goleiro fica sempre no gol; as demais vagas vêm do navegador, dentro dos limites do campo.
  const goalkeeper = FORMATION_TEMPLATES["4-3-3"][0];
  const round = (value: number) => Math.round(value * 100) / 100;
  const slots = [...input.slots]
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((slot) => ({
      ...slot,
      x: slot.slotIndex === 0 ? goalkeeper.x : round(slot.x),
      y: slot.slotIndex === 0 ? goalkeeper.y : round(slot.y),
      strengths: [...new Set(slot.strengths)],
      notes: slot.notes || null,
    }));

  let formationId: string | null;
  try {
    const clubPlayerIds = new Set((await listPlayersByClub(input.clubId)).map((player) => player.id));
    if (input.slots.some((slot) => slot.playerId && !clubPlayerIds.has(slot.playerId))) {
      return { status: "error", message: "Há um jogador que não pertence a este clube." };
    }

    formationId = await saveFormation({
      formationId: input.formationId,
      clubId: input.clubId,
      name: input.name,
      // O nome do esquema é calculado aqui, a partir das vagas, nunca vem pronto do navegador.
      formationType: formationLabel(input.preset, slots),
      roles: input.roles,
      slots,
    });
    if (!formationId) return { status: "error", message: "Formação não encontrada." };
    revalidatePath(`/clubs/${input.clubId}/formations`, "layout");
  } catch (error) {
    logServerError("saveFormationAction", error);
    return { status: "error", message: getUserMessage(error) };
  }

  // Formação nova: vai para a URL dela (permite compartilhar e continuar editando).
  if (!input.formationId) redirect(`/clubs/${input.clubId}/formations/${formationId}`);
  return { status: "saved", savedAt: new Date().toISOString() };
}

const deleteInputSchema = z.object({ clubId: z.uuid(), formationId: z.uuid() });

export async function deleteFormationAction(
  _previous: SaveFormationState,
  payload: z.input<typeof deleteInputSchema>,
): Promise<SaveFormationState> {
  const parsed = deleteInputSchema.safeParse(payload);
  if (!parsed.success) return { status: "error", message: "Dados inválidos." };

  try {
    await deleteFormation(parsed.data.clubId, parsed.data.formationId);
    revalidatePath(`/clubs/${parsed.data.clubId}/formations`, "layout");
  } catch (error) {
    logServerError("deleteFormationAction", error);
    return { status: "error", message: getUserMessage(error) };
  }
  redirect(`/clubs/${parsed.data.clubId}/formations`);
}
