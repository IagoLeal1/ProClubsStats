import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { groupMonths, isMonthId, pickMonthAwards } from "@/lib/stats/months";

import { loadClub } from "../../load-club";

/** Clube + mês + prêmios (página e imagem de prévia compartilham via cache). */
export const loadMonth = cache(async (clubId: string, monthId: string) => {
  const club = await loadClub(clubId);
  if (!isMonthId(monthId)) notFound();

  const [matches, stats] = await Promise.all([
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  const months = groupMonths(matches);
  const index = months.findIndex((month) => month.id === monthId);
  if (index === -1) notFound();

  const month = months[index];
  return {
    club,
    month,
    awards: pickMonthAwards(month, stats),
    /** Meses vizinhos que tiveram jogos. */
    previousMonthId: months[index - 1]?.id ?? null,
    nextMonthId: months[index + 1]?.id ?? null,
  };
});
