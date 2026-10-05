import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { groupSessions, summarizeSession } from "@/lib/stats/sessions";

import { isValidId, loadClub } from "../../load-club";

/** Clube + sessão + resumo (página e imagem de prévia compartilham via cache). */
export const loadSession = cache(async (clubId: string, sessionId: string) => {
  const club = await loadClub(clubId);
  if (!isValidId(sessionId)) notFound();

  const [matches, stats] = await Promise.all([
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  const session = groupSessions(matches).find((candidate) => candidate.id === sessionId);
  if (!session) notFound();

  return { club, session, summary: summarizeSession(session, stats) };
});
