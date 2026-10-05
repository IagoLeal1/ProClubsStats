"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { findClubByEaId } from "@/lib/db/clubs.repository";
import { getUserMessage, logServerError } from "@/lib/errors";
import { requestClubSync, type SyncRequest } from "@/services/sync/sync.service";
import { PLATFORMS } from "@/types/club";

const syncClubInputSchema = z.object({
  eaClubId: z.coerce.number().int().positive(),
  platform: z.enum(PLATFORMS),
});

export type SyncClubActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; message: string; warnings: string[] };

type SyncInput = z.output<typeof syncClubInputSchema>;
type SyncAttempt = { ok: true; input: SyncInput; request: SyncRequest } | { ok: false; message: string };

const QUEUED_MESSAGE =
  "Atualização pedida — a EA só aceita nosso robô de sincronização. Os dados novos aparecem em 1–2 minutos; recarregue a página.";

async function runSync(formData: FormData): Promise<SyncAttempt> {
  const parsed = syncClubInputSchema.safeParse({
    eaClubId: formData.get("eaClubId"),
    platform: formData.get("platform"),
  });
  if (!parsed.success) return { ok: false, message: "Dados inválidos para sincronização." };

  try {
    const request = await requestClubSync(parsed.data.eaClubId, parsed.data.platform);
    if (request.status === "synced") revalidatePath(`/clubs/${request.result.club.id}`, "layout");
    return { ok: true, input: parsed.data, request };
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

  if (attempt.request.status === "queued") {
    // Clube já salvo: abre o que temos enquanto o robô atualiza.
    const stored = await findClubByEaId(attempt.input.eaClubId, attempt.input.platform).catch(() => null);
    if (stored) redirect(`/clubs/${stored.id}?sync=queued`);
    return {
      status: "done",
      message:
        "Estamos adicionando o clube. Em 1–2 minutos ele aparece em “Já acompanhados” — pesquise de novo.",
      warnings: [],
    };
  }

  const { club, warnings } = attempt.request.result;
  redirect(`/clubs/${club.id}${warnings.length > 0 ? "?sync=partial" : ""}`);
}

/** Botão "Atualizar" no cabeçalho do clube: sincroniza e permanece na página. */
export async function refreshClubAction(
  _previous: SyncClubActionState,
  formData: FormData,
): Promise<SyncClubActionState> {
  const attempt = await runSync(formData);
  if (!attempt.ok) return { status: "error", message: attempt.message };
  if (attempt.request.status === "queued") {
    return { status: "done", message: QUEUED_MESSAGE, warnings: [] };
  }

  const { synced, matches, warnings } = attempt.request.result;
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
