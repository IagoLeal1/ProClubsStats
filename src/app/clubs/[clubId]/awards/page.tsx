import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AwardIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";
import { listAllClubMatches } from "@/lib/db/matches.repository";
import { groupMonths } from "@/lib/stats/months";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Prêmios do mês" };

/** Abre o mês mais recente com jogos. */
export default async function LatestAwardsPage({ params }: PageProps<"/clubs/[clubId]/awards">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const latest = groupMonths(await listAllClubMatches(club.id)).at(-1);

  if (!latest) {
    return (
      <EmptyState
        icon={AwardIcon}
        title="Sem partidas salvas ainda"
        description="Os prêmios saem das partidas que o site salva a cada sincronização."
      />
    );
  }
  redirect(`/clubs/${club.id}/awards/${latest.id}`);
}
