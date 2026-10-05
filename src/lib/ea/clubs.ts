import "server-only";

import type { ClubSearchResult, ClubSnapshot, Platform } from "@/types/club";

import { getEAClient } from "./client";
import { EA_ENDPOINTS, EA_PLATFORM_CODES } from "./constants";
import { EAError, isEANotFound } from "./errors";
import {
  mapEAClub,
  mapEAClubInfoToSearchResult,
  mapEAClubSearchResult,
} from "./mappers";
import {
  EAClubInfoResponseSchema,
  EAClubOverallStatsResponseSchema,
  EALeaderboardSearchResponseSchema,
  type EAClubDetails,
} from "./types";

const isNumericId = (value: string) => /^\d{1,12}$/.test(value);

async function fetchClubDetails(
  eaClubId: number,
  platform: Platform,
): Promise<EAClubDetails> {
  const response = await getEAClient().get(
    EA_ENDPOINTS.clubInfo,
    { platform: EA_PLATFORM_CODES[platform], clubIds: eaClubId },
    EAClubInfoResponseSchema,
  );

  const details = response[String(eaClubId)];
  if (!details) {
    throw new EAError("not_found", "Clube não encontrado na EA", {
      endpoint: EA_ENDPOINTS.clubInfo,
    });
  }
  return details;
}

async function fetchClubOverallStats(eaClubId: number, platform: Platform) {
  const response = await getEAClient().get(
    EA_ENDPOINTS.clubOverallStats,
    { platform: EA_PLATFORM_CODES[platform], clubIds: eaClubId },
    EAClubOverallStatsResponseSchema,
  );
  return response.find((stats) => stats.clubId === eaClubId) ?? null;
}

/**
 * Busca clubes pelo nome no ranking geral da EA. Se o termo for numérico,
 * também tenta interpretá-lo como ID de clube.
 */
export async function searchClubs(
  query: string,
  platform: Platform,
): Promise<ClubSearchResult[]> {
  const term = query.trim();

  const [byName, byId] = await Promise.all([
    getEAClient().get(
      EA_ENDPOINTS.leaderboardSearch,
      { platform: EA_PLATFORM_CODES[platform], clubName: term },
      EALeaderboardSearchResponseSchema,
    ),
    isNumericId(term) ? findClubById(Number(term), platform) : Promise.resolve(null),
  ]);

  const results = byName
    .map((entry) => mapEAClubSearchResult(entry, platform))
    .filter((result): result is ClubSearchResult => result !== null);

  if (byId && !results.some((result) => result.eaClubId === byId.eaClubId)) {
    results.unshift(byId);
  }
  return results;
}

async function findClubById(
  eaClubId: number,
  platform: Platform,
): Promise<ClubSearchResult | null> {
  try {
    const details = await fetchClubDetails(eaClubId, platform);
    return mapEAClubInfoToSearchResult(eaClubId, platform, details);
  } catch (error) {
    if (isEANotFound(error)) return null;
    throw error;
  }
}

/** Dados atuais do clube (informações + estatísticas gerais). */
export async function fetchClubSnapshot(
  eaClubId: number,
  platform: Platform,
): Promise<ClubSnapshot> {
  const [details, overall] = await Promise.all([
    fetchClubDetails(eaClubId, platform),
    fetchClubOverallStats(eaClubId, platform),
  ]);
  return mapEAClub(eaClubId, platform, details, overall);
}
