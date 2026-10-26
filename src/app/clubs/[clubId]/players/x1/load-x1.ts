import "server-only";

import { cache } from "react";

import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { computeX1Table } from "@/lib/stats/x1";

import { loadClub } from "../../load-club";

/** Clube + tabela do Rei do x1 (página e imagem de prévia compartilham via cache). */
export const loadX1 = cache(async (clubId: string) => {
  const club = await loadClub(clubId);
  const [squad, matches, stats] = await Promise.all([
    listPlayersByClub(club.id),
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  // Só o elenco atual entra no campeonato.
  const players = squad.filter((player) => player.isMember).map((player) => ({ id: player.id, name: player.name }));
  return { club, table: computeX1Table(players, matches, stats) };
});
