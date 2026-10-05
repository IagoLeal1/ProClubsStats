"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getUserMessage, logServerError } from "@/lib/errors";
import { syncClub, type SyncResult } from "@/services/sync/sync.service";
import { PLATFORMS } from "@/types/club";

const syncClubInputSchema = z.object({
  eaClubId: z.coerce.number().int().positive(),
  platform: z.enum(PLATFORMS),
});

export type SyncClubActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; message: string; warnings: string[] };

type SyncAttempt = { ok: true; result: SyncResult } | { ok: false; message: string };

async function runSync(formData: FormData): Promise<SyncAttempt> {
  const input = syncClubInputSchema.safeParse({
    eaClubId: formData.get("eaClubId"),
    platform: formData.get("platform"),
  });
  if (!input.success) return { ok: false, message: "Dados inválidos para sincronização." };

  try {
    const result = await syncClub(input.data.eaClubId, input.data.platform);
    revalidatePath(`/clubs/${result.club.id}`, "layout");
    return { ok: true, result };
  } catch (error) {
    logServerError("syncClubAction", error);
    return { ok: false, message: getUserMessage(error) };
  }
}

/** Resultado da busca → sincroniza e abre o dashboard do clube. */
export async function openClubAction(
  _previous: SyncClubActionState,
  formData: FormData,
): Promise<SyncClubActionState> {
  const attempt = await runSync(formData);
  if (!attempt.ok) return { status: "error", message: attempt.message };

  const { club, warnings } = attempt.result;
  redirect(`/clubs/${club.id}${warnings.length > 0 ? "?sync=partial" : ""}`);
}

/** Botão "Atualizar" no cabeçalho do clube: sincroniza e permanece na página. */
export async function refreshClubAction(
  _previous: SyncClubActionState,
  formData: FormData,
): Promise<SyncClubActionState> {
  const attempt = await runSync(formData);
  if (!attempt.ok) return { status: "error", message: attempt.message };

  const { synced, matches, warnings } = attempt.result;
  if (!synced) {
    return { status: "done", message: "Dados atualizados há pouco.", warnings: [] };
  }

  const newMatches = matches?.newMatches ?? 0;
  const message =
    newMatches > 0
      ? `${newMatches} nova(s) partida(s) adicionada(s) ao histórico.`
      : "Dados atualizados. Nenhuma partida nova.";
  return { status: "done", message, warnings };
}
