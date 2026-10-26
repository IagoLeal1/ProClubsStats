import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { listAllClubMatches, listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { firstTrackedMatch } from "@/lib/stats/tracked-events";
import { compareTwoPlayers, type VersusScope } from "@/lib/stats/versus";

import { isValidId, loadClub } from "../../../../load-club";

const dayMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

/** Clube + os dois jogadores + o duelo (página e imagem de prévia compartilham via cache). */
export const loadVersus = cache(async (clubId: string, playerId: string, otherId: string, scope: VersusScope) => {
  const club = await loadClub(clubId);
  if (!isValidId(playerId) || !isValidId(otherId) || playerId === otherId) notFound();

  const [squad, matches, stats] = await Promise.all([
    listPlayersByClub(club.id),
    listAllClubMatches(club.id),
    listClubPlayerMatchStats(club.id),
  ]);
  const a = squad.find((player) => player.id === playerId);
  const b = squad.find((player) => player.id === otherId);
  if (!a || !b) notFound();

  const trackedSince = firstTrackedMatch(matches, stats);
  const { duel, together } = compareTwoPlayers(a.id, b.id, matches, stats, {
    scope,
    trackedSince: trackedSince && dayMonth.format(new Date(trackedSince)),
  });

  return {
    club,
    a,
    b,
    duel,
    together,
    /** Quem pode entrar no duelo: membros e ex-membros com jogos. */
    candidates: squad.filter((player) => player.isMember || player.stats.gamesPlayed > 0),
  };
});
