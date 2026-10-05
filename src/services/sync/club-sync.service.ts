import "server-only";

import { upsertClub } from "@/lib/db/clubs.repository";
import { fetchClubSnapshot } from "@/lib/ea";
import type { Club, Platform } from "@/types/club";

/** Busca o clube na EA e cria/atualiza o registro no banco. */
export async function syncClubProfile(
  eaClubId: number,
  platform: Platform,
  syncedAt: string,
): Promise<Club> {
  const snapshot = await fetchClubSnapshot(eaClubId, platform);
  return upsertClub(snapshot, syncedAt);
}
