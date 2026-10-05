import type { Metadata } from "next";
import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { PLAYER_STAT_COLUMNS } from "@/components/players/player-columns";
import { PlayerStatsCard } from "@/components/players/PlayerStatsCard";
import { defaultDirection, PlayerTable, sortHref } from "@/components/players/PlayerTable";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { PLAYER_SORT_KEYS, sortPlayers } from "@/lib/stats/player-stats";
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

  // Ex-membros sem nenhum jogo (criados só para vincular partidas) poluiriam a lista.
  const players = sortPlayers(
    (await listPlayersByClub(club.id)).filter(
      (player) => player.isMember || player.stats.gamesPlayed > 0,
    ),
    sort,
    direction,
  );

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
        description={`${players.length} jogadores · estatísticas da temporada no clube (EA)`}
      />

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
                    "block rounded-full border px-3 py-1 text-xs",
                    sort === column.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground",
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
          <PlayerStatsCard key={player.id} player={player} />
        ))}
      </div>

      <div className="hidden md:block">
        <PlayerTable players={players} basePath={basePath} sort={sort} direction={direction} />
      </div>
    </section>
  );
}
