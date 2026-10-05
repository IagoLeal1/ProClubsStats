import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShirtIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";
import { listAllClubMatches } from "@/lib/db/matches.repository";
import { groupWeeks } from "@/lib/stats/weeks";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Time da semana" };

/** Abre a semana mais recente com jogos. */
export default async function LatestTeamOfTheWeekPage({ params }: PageProps<"/clubs/[clubId]/team-of-the-week">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const latest = groupWeeks(await listAllClubMatches(club.id)).at(-1);

  if (!latest) {
    return (
      <EmptyState
        icon={ShirtIcon}
        title="Sem partidas salvas ainda"
        description="O time da semana sai das partidas que o site salva a cada sincronização."
      />
    );
  }
  redirect(`/clubs/${club.id}/team-of-the-week/${latest.id}`);
}
