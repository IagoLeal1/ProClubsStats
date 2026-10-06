import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { getFormation } from "@/lib/db/formations.repository";
import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { buildLineupView } from "@/lib/formations/lineup-view";
import { computeSquadForm } from "@/lib/stats/form";
import { computeAssistLinks } from "@/lib/stats/partnerships";
import { ratingsByPosition } from "@/lib/stats/positions";

import { isValidId, loadClub } from "../../load-club";

/** Clube + formação da rota (página, edição e prévia compartilham via cache). */
export const loadFormation = cache(async (clubId: string, formationId: string) => {
  const club = await loadClub(clubId);
  if (!isValidId(formationId)) notFound();
  const formation = await getFormation(club.id, formationId);
  if (!formation) notFound();
  return { club, formation };
});

/** Formação + números de cada escalado, para a escalação e o card do WhatsApp. */
export const loadLineup = cache(async (clubId: string, formationId: string) => {
  const { club, formation } = await loadFormation(clubId, formationId);
  const [squad, matches, stats] = await Promise.all([
    listPlayersByClub(club.id),
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  const view = buildLineupView(
    formation,
    squad,
    ratingsByPosition(stats),
    computeSquadForm(matches, stats, squad),
    computeAssistLinks(matches, stats).links,
  );
  return { club, formation, view };
});
