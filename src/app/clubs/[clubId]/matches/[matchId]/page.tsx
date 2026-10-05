import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/layout/BackLink";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchPlayerStats } from "@/components/matches/MatchPlayerStats";
import { MatchScoreboard } from "@/components/matches/MatchScoreboard";
import { MatchTeamStats } from "@/components/matches/MatchTeamStats";
import { getMatchDetails } from "@/lib/db/matches.repository";

import { isValidId, loadClub } from "../../load-club";

export const metadata: Metadata = { title: "Detalhes da partida" };

export default async function MatchDetailsPage({
  params,
}: PageProps<"/clubs/[clubId]/matches/[matchId]">) {
  const { clubId, matchId } = await params;
  const club = await loadClub(clubId);
  if (!isValidId(matchId)) notFound();

  const match = await getMatchDetails(club.id, matchId);
  if (!match) notFound();

  return (
    <div className="space-y-8">
      <BackLink href={`/clubs/${club.id}/matches`}>Partidas</BackLink>

      <MatchScoreboard club={club} match={match} />

      {match.clubStats && match.opponentStats && (
        <section>
          <SectionHeading title="Estatísticas da partida" />
          <MatchTeamStats club={match.clubStats} opponent={match.opponentStats} />
        </section>
      )}

      <section>
        <SectionHeading
          title="Jogadores utilizados"
          description="★ = MVP da partida · cartões amarelos e interceptações ainda não são fornecidos pela EA."
        />
        {match.players.length > 0 ? (
          <MatchPlayerStats clubId={club.id} players={match.players} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma estatística individual registrada para esta partida.
          </p>
        )}
      </section>
    </div>
  );
}
