import { TriangleAlertIcon } from "lucide-react";

import { ClubProgress } from "@/components/clubs/ClubProgress";
import { ClubRecentMatches } from "@/components/clubs/ClubRecentMatches";
import { ClubRecord } from "@/components/clubs/ClubRecord";
import { ClubStats } from "@/components/clubs/ClubStats";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { PlayerRanking } from "@/components/players/PlayerRanking";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listClubProgress } from "@/lib/db/clubs.repository";
import { listRecentMatches } from "@/lib/db/matches.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { buildPlayerRankings } from "@/lib/stats/player-stats";

import { loadClub } from "./load-club";

const RECENT_MATCHES = 5;

export default async function ClubDashboardPage({
  params,
  searchParams,
}: PageProps<"/clubs/[clubId]">) {
  const [{ clubId }, { sync }] = await Promise.all([params, searchParams]);
  const club = await loadClub(clubId);

  const [recentMatches, players, progress] = await Promise.all([
    listRecentMatches(club.id, RECENT_MATCHES),
    listPlayersByClub(club.id),
    listClubProgress(club.id),
  ]);
  const rankings = buildPlayerRankings(players.filter((player) => player.isMember));

  return (
    <div className="space-y-10">
      {sync === "partial" && (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Sincronização parcial</AlertTitle>
          <AlertDescription>
            Alguns dados não puderam ser atualizados agora. Exibindo o que já está salvo — use
            &quot;Atualizar&quot; para tentar de novo.
          </AlertDescription>
        </Alert>
      )}

      <section>
        <SectionHeading title="Resumo" description="Partidas de liga registradas pela EA" />
        <ClubStats record={club.record} />
      </section>

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-6">
        <section className="lg:col-span-2">
          <SectionHeading title="Últimos jogos" description="Do histórico salvo no FC Clubs Stats" />
          <ClubRecentMatches clubId={club.id} matches={recentMatches} formSize={RECENT_MATCHES} />
        </section>
        <section>
          <SectionHeading title="Desempenho" />
          <ClubRecord record={club.record} />
        </section>
      </div>

      <section>
        <SectionHeading title="Evolução do skill rating" description="Registrada a cada jogo de liga" />
        <ClubProgress points={progress} />
      </section>

      <section>
        <SectionHeading
          title="Rankings do elenco"
          description="Membros atuais · estatísticas da temporada no clube (EA)"
        />
        <PlayerRanking categories={rankings} />
      </section>
    </div>
  );
}
