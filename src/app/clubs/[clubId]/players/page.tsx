import type { Metadata } from "next";
import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { DuelLink } from "@/components/players/DuelLink";
import { OverallRisers } from "@/components/players/OverallRisers";
import { PLAYER_STAT_COLUMNS } from "@/components/players/player-columns";
import { PlayerStatsCard } from "@/components/players/PlayerStatsCard";
import { defaultDirection, PlayerTable, sortHref } from "@/components/players/PlayerTable";
import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { listClubPlayerProgress, listPlayersByClub } from "@/lib/db/players.repository";
import { computeSquadForm } from "@/lib/stats/form";
import { overallTrends } from "@/lib/stats/progress";
import { PLAYER_SORT_KEYS, sortPlayers } from "@/lib/stats/player-stats";
import { pickDuelOpponent } from "@/lib/stats/versus";
import { cn } from "@/lib/utils";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Jogadores" };

const searchParamsSchema = z.object({
  sort: z.enum(PLAYER_SORT_KEYS).catch("goalsAndAssists"),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
});

export default async function ClubPlayersPage({
  params,
  searchParams,
}: PageProps<"/clubs/[clubId]/players">) {
  const [{ clubId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const club = await loadClub(clubId);

  const { sort, dir } = searchParamsSchema.parse(rawSearchParams);
  const direction = dir ?? defaultDirection(sort);
  const basePath = `/clubs/${club.id}/players`;

  const [squad, matches, stats, progress] = await Promise.all([
    listPlayersByClub(club.id),
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
    listClubPlayerProgress(club.id),
  ]);
  // Ex-membros sem nenhum jogo (criados só para vincular partidas) poluiriam a lista.
  const players = sortPlayers(
    squad.filter((player) => player.isMember || player.stats.gamesPlayed > 0),
    sort,
    direction,
  );
  const forms = computeSquadForm(matches, stats, players);
  const duelA = pickDuelOpponent(players);
  const duelB = duelA && pickDuelOpponent(players, duelA.id);

  if (players.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Nenhum jogador salvo"
        description="Os jogadores aparecem depois da sincronização com a EA."
      />
    );
  }

  return (
    <section>
      <SectionHeading
        title="Jogadores"
        description={`${players.length} jogadores · estatísticas da temporada no clube (EA) · seta = fase nos últimos jogos`}
        action={
          duelA && duelB ? <DuelLink href={`${basePath}/${duelA.id}/vs/${duelB.id}`} label="Duelo x1" /> : undefined
        }
      />

      <OverallRisers clubId={club.id} players={players} trends={overallTrends(progress)} />

      {/* Mobile: cards + atalhos de ordenação */}
      <div className="space-y-3 md:hidden">
        <nav aria-label="Ordenar jogadores" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-1.5">
            {PLAYER_STAT_COLUMNS.filter((column) => column.key !== "position").map((column) => (
              <li key={column.key}>
                <Link
                  href={sortHref(basePath, column.key, sort, direction)}
                  scroll={false}
                  className={cn(
                    "flex h-9 items-center rounded-full border px-3.5 text-sm font-semibold",
                    sort === column.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-muted-foreground",
                  )}
                >
                  {column.label}
                  {sort === column.key && (direction === "asc" ? " ↑" : " ↓")}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {players.map((player) => (
          <PlayerStatsCard key={player.id} player={player} form={forms.get(player.id)} />
        ))}
      </div>

      <div className="hidden md:block">
        <PlayerTable players={players} basePath={basePath} sort={sort} direction={direction} forms={forms} />
      </div>
    </section>
  );
}
