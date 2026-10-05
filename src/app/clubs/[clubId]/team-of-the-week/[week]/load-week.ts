import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { groupWeeks, isWeekId, pickTeamOfTheWeek } from "@/lib/stats/weeks";

import { loadClub } from "../../load-club";

/** Clube + semana + time (página e imagem de prévia compartilham via cache). */
export const loadWeek = cache(async (clubId: string, weekId: string) => {
  const club = await loadClub(clubId);
  if (!isWeekId(weekId)) notFound();

  const [matches, stats] = await Promise.all([
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  const weeks = groupWeeks(matches);
  const index = weeks.findIndex((week) => week.id === weekId);
  if (index === -1) notFound();

  const week = weeks[index];
  return {
    club,
    week,
    team: pickTeamOfTheWeek(week, stats),
    /** Semanas vizinhas que tiveram jogos. */
    previousWeekId: weeks[index - 1]?.id ?? null,
    nextWeekId: weeks[index + 1]?.id ?? null,
  };
});
