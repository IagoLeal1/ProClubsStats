import type { Platform } from "@/types/club";
import type { MatchType } from "@/types/match";

/**
 * Endpoints não oficiais usados pelo site da EA (www.ea.com/games/ea-sports-fc/clubs).
 * Confirmados em 2026-10-05 na página "Clubs do EA SPORTS FC™ 27", que declara
 * estes caminhos no HTML, e testados com respostas reais.
 * Detalhes em docs/ea-endpoints.md.
 */
export const EA_DEFAULT_BASE_URL = "https://proclubs.ea.com/api/fc";

export const EA_ENDPOINTS = {
  leaderboardSearch: "/allTimeLeaderboard/search",
  clubInfo: "/clubs/info",
  clubOverallStats: "/clubs/overallStats",
  memberStats: "/members/stats",
  matches: "/clubs/matches",
} as const;

/**
 * "common-gen5" agrupa PS5 / Xbox Series / PC (crossplay); "nx" é Switch.
 * "common-gen4" é rejeitado pela API atual (HTTP 400).
 */
export const EA_PLATFORM_CODES: Record<Platform, string> = {
  crossplay: "common-gen5",
  switch: "nx",
};

export const EA_MATCH_TYPE_CODES: Record<MatchType, string> = {
  league: "leagueMatch",
  playoff: "playoffMatch",
  friendly: "friendlyMatch",
};

/** A API retorna no máximo 10 partidas por tipo, mesmo pedindo mais. */
export const EA_MAX_MATCHES_PER_TYPE = 10;

/** Base de escudos usada pelo próprio site da EA (atributo crest-base-url). */
export const EA_CREST_BASE_URL =
  "https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l";
