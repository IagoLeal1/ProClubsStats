import "server-only";

import type { EditorMember } from "@/components/formations/SlotDialog";
import { listClubPlayerMatchStats } from "@/lib/db/matches.repository";
import { listPlayersByClub } from "@/lib/db/players.repository";
import { ratingsByPosition } from "@/lib/stats/positions";
import type { Formation } from "@/types/formation";

/**
 * Jogadores que podem ser escalados: membros atuais, mais quem já está numa
 * vaga desta formação (mesmo que tenha saído do clube), em ordem alfabética,
 * com a nota média de cada um por setor nas partidas salvas.
 */
export async function listEditorMembers(
  clubId: string,
  formation: Formation | null,
): Promise<EditorMember[]> {
  const assigned = new Set(formation?.slots.flatMap((slot) => (slot.playerId ? [slot.playerId] : [])));
  const [players, stats] = await Promise.all([listPlayersByClub(clubId), listClubPlayerMatchStats(clubId)]);
  const ratings = ratingsByPosition(stats);

  return players
    .filter((player) => player.isMember || assigned.has(player.id))
    .map((player) => ({
      id: player.id,
      name: player.name,
      proName: player.proName,
      ratings: ratings.get(player.id) ?? {},
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
