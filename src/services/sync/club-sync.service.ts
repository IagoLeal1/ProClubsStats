import "server-only";

import { recordClubProgress, upsertClub } from "@/lib/db/clubs.repository";
import { fetchClubSnapshot } from "@/lib/ea";
import { logServerError } from "@/lib/errors";
import type { Club, Platform } from "@/types/club";

/**
 * Busca o clube na EA, cria/atualiza o registro no banco e acrescenta um
 * ponto na linha do tempo do skill rating quando houver jogo novo.
 */
export async function syncClubProfile(
  eaClubId: number,
  platform: Platform,
  syncedAt: string,
): Promise<Club> {
  const snapshot = await fetchClubSnapshot(eaClubId, platform);
  const club = await upsertClub(snapshot, syncedAt);

  try {
    await recordClubProgress(club);
  } catch (error) {
    // A evolução é complementar: não derruba a sincronização do clube.
    logServerError("sync:progress", error);
  }
  return club;
}
