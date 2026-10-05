import "server-only";

import type { Platform } from "@/types/club";
import { MATCH_TYPES, type MatchSnapshot, type MatchType } from "@/types/match";

import { getEAClient } from "./client";
import {
  EA_ENDPOINTS,
  EA_MATCH_TYPE_CODES,
  EA_MAX_MATCHES_PER_TYPE,
  EA_PLATFORM_CODES,
} from "./constants";
import { EAError, isEAError } from "./errors";
import { mapEAMatch } from "./mappers";
import { EAMatchesResponseSchema, EAMatchSchema } from "./types";

export interface RecentMatchesResult {
  matches: MatchSnapshot[];
  /** Partidas ignoradas por formato inesperado. */
  skipped: number;
}

export interface AllRecentMatchesResult extends RecentMatchesResult {
  failures: { matchType: MatchType; error: EAError }[];
}

/** Últimas partidas de um tipo (a EA retorna no máximo 10). */
export async function fetchRecentMatches(
  eaClubId: number,
  platform: Platform,
  matchType: MatchType,
): Promise<RecentMatchesResult> {
  const items = await getEAClient().get(
    EA_ENDPOINTS.matches,
    {
      platform: EA_PLATFORM_CODES[platform],
      clubIds: eaClubId,
      matchType: EA_MATCH_TYPE_CODES[matchType],
      maxResultCount: EA_MAX_MATCHES_PER_TYPE,
    },
    EAMatchesResponseSchema,
  );

  const matches: MatchSnapshot[] = [];
  let skipped = 0;

  for (const item of items) {
    const parsed = EAMatchSchema.safeParse(item);
    const snapshot = parsed.success ? mapEAMatch(parsed.data, eaClubId, matchType) : null;
    if (snapshot) matches.push(snapshot);
    else skipped++;
  }

  return { matches, skipped };
}

/**
 * Busca liga, playoff e amistosos em paralelo. A falha de um tipo não
 * impede os outros: ela é devolvida em `failures` (dados parciais).
 */
export async function fetchAllRecentMatches(
  eaClubId: number,
  platform: Platform,
): Promise<AllRecentMatchesResult> {
  const settled = await Promise.allSettled(
    MATCH_TYPES.map((matchType) => fetchRecentMatches(eaClubId, platform, matchType)),
  );

  const result: AllRecentMatchesResult = { matches: [], skipped: 0, failures: [] };

  settled.forEach((outcome, index) => {
    const matchType = MATCH_TYPES[index];
    if (outcome.status === "fulfilled") {
      result.matches.push(...outcome.value.matches);
      result.skipped += outcome.value.skipped;
      return;
    }
    const error = isEAError(outcome.reason)
      ? outcome.reason
      : new EAError("unavailable", "Erro inesperado ao buscar partidas", {
          endpoint: EA_ENDPOINTS.matches,
          cause: outcome.reason,
        });
    result.failures.push({ matchType, error });
  });

  return result;
}
