import "server-only";

import type { EditorMember } from "@/components/formations/SlotDialog";
import { listPlayersByClub } from "@/lib/db/players.repository";
import type { Formation } from "@/types/formation";

/**
 * Jogadores que podem ser escalados: membros atuais, mais quem já está numa
 * vaga desta formação (mesmo que tenha saído do clube), em ordem alfabética.
 */
export async function listEditorMembers(
  clubId: string,
  formation: Formation | null,
): Promise<EditorMember[]> {
  const assigned = new Set(formation?.slots.flatMap((slot) => (slot.playerId ? [slot.playerId] : [])));
  const players = await listPlayersByClub(clubId);

  return players
    .filter((player) => player.isMember || assigned.has(player.id))
    .map((player) => ({ id: player.id, name: player.name, proName: player.proName }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
