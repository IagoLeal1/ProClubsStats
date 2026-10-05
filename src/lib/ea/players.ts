import "server-only";

import type { Platform } from "@/types/club";
import type { PlayerSnapshot } from "@/types/player";

import { getEAClient } from "./client";
import { EA_ENDPOINTS, EA_PLATFORM_CODES } from "./constants";
import { mapEAMember } from "./mappers";
import { EAMembersResponseSchema } from "./types";

/**
 * Membros atuais do clube com as estatísticas da temporada no clube.
 * A EA identifica membros apenas pelo gamertag (campo `name`).
 */
export async function fetchClubMembers(
  eaClubId: number,
  platform: Platform,
): Promise<PlayerSnapshot[]> {
  const response = await getEAClient().get(
    EA_ENDPOINTS.memberStats,
    { platform: EA_PLATFORM_CODES[platform], clubId: eaClubId },
    EAMembersResponseSchema,
  );

  return response.members
    .map(mapEAMember)
    .filter((player): player is PlayerSnapshot => player !== null);
}
