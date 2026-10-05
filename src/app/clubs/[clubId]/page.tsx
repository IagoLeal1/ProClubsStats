import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { ClubProgress } from "@/components/clubs/ClubProgress";
import { ClubRecentMatches } from "@/components/clubs/ClubRecentMatches";
import { ClubStats } from "@/components/clubs/ClubStats";
import { LastSessionCard } from "@/components/clubs/LastSessionCard";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { PlayerRanking } from "@/components/players/PlayerRanking";
import { AssistLinks } from "@/components/records/AssistLinks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listClubProgress } from "@/lib/db/clubs.repository";
import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { computeAssistLinks } from "@/lib/stats/partnerships";
import { buildPlayerRankings } from "@/lib/stats/player-stats";
import { groupSessions, summarizeSession } from "@/lib/stats/sessions";

import { loadClub } from "./load-club";

const RECENT_MATCHES = 5;

export default async function ClubDashboardPage({
  params,
  searchParams,
}: PageProps<"/clubs/[clubId]">) {
  const [{ clubId }, { sync }] = await Promise.all([params, searchParams]);
  const club = await loadClub(clubId);

  const [matches, stats, players, progress] = await Promise.all([
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
    listPlayersByClub(club.id),
    listClubProgress(club.id),
  ]);

  const rankings = buildPlayerRankings(players.filter((player) => player.isMember));
  const recentMatches = matches.slice(-RECENT_MATCHES).reverse();
  const lastSession = groupSessions(matches).at(-1);
  const assistLinks = computeAssistLinks(matches, stats);

  return (
    <div className="space-y-11">
      {sync === "queued" && (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Atualização pedida</AlertTitle>
          <AlertDescription>
            Os dados novos chegam em 1–2 minutos. Enquanto isso, você vê o que já está salvo.
          </AlertDescription>
        </Alert>
      )}
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

      <ClubStats record={club.record} />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
          {lastSession && (
            <LastSessionCard
              clubId={club.id}
              session={lastSession}
              summary={summarizeSession(lastSession, stats)}
            />
          )}
          <ClubRecentMatches clubId={club.id} matches={recentMatches} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <section className="flex flex-col gap-4 border bg-card p-5 sm:p-6">
            <div className="space-y-1">
              <span className="kicker text-primary">Conexões de gol</span>
              <p className="text-sm text-muted-foreground">
                Quem deu assistência para quem — só o que dá para garantir pelos números de cada
                partida.
              </p>
            </div>
            <AssistLinks clubId={club.id} links={assistLinks.links} limit={4} />
            <Link href={`/clubs/${club.id}/records`} className="text-sm text-muted-foreground hover:text-foreground">
              {assistLinks.confirmedAssists} de {assistLinks.totalAssists} assistências confirmadas · ver recordes
            </Link>
          </section>
          <ClubProgress points={progress} />
        </aside>
      </div>

      <section>
        <SectionHeading
          title="Rankings do elenco"
          action={<span className="text-sm text-muted-foreground">Temporada no clube · EA</span>}
        />
        <PlayerRanking categories={rankings} />
      </section>
    </div>
  );
}
