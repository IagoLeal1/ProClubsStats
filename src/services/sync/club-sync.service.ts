import "server-only";

import { recordClubProgress, upsertClub } from "@/lib/db/clubs.repository";
import { fetchClubDivision, fetchClubSnapshot } from "@/lib/ea";
import { logServerError } from "@/lib/errors";
import type { Club, ClubDivision, Platform } from "@/types/club";

/**
 * Busca o clube (e a divisão) na EA, cria/atualiza o registro no banco e
 * acrescenta um ponto na linha do tempo do skill rating quando houver jogo novo.
 */
export async function syncClubProfile(
  eaClubId: number,
  platform: Platform,
  syncedAt: string,
): Promise<Club> {
  const snapshot = await fetchClubSnapshot(eaClubId, platform);
  let division: ClubDivision | null = null;
  try {
    division = await fetchClubDivision(eaClubId, snapshot.name, platform);
  } catch (error) {
    // A divisão é complementar: sem ela, fica a que já estava salva.
    logServerError("sync:division", error);
  }
  const club = await upsertClub({ ...snapshot, division }, syncedAt);

  try {
    await recordClubProgress(club);
  } catch (error) {
    // A evolução é complementar: não derruba a sincronização do clube.
    logServerError("sync:progress", error);
  }
  return club;
}
