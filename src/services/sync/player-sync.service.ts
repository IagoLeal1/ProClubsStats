import "server-only";

import {
  insertPlayersFromMatches,
  linkEaPlayerIds,
  listPlayerIdentities,
  markPlayersAsFormerMembers,
  upsertMemberSnapshots,
  type PlayerIdentity,
} from "@/lib/db/players.repository";
import { fetchClubMembers } from "@/lib/ea";
import type { Club } from "@/types/club";

export interface PlayerSyncResult {
  members: number;
  formerMembers: number;
}

/**
 * Atualiza os membros atuais com as estatísticas da EA. Quem não aparece mais
 * na lista é marcado como ex-membro (nunca apagado).
 */
export async function syncClubPlayers(
  club: Club,
  syncedAt: string,
): Promise<PlayerSyncResult> {
  const members = await fetchClubMembers(club.eaClubId, club.platform);
  await upsertMemberSnapshots(club.id, members, syncedAt);

  // Lista vazia é mais provável ser instabilidade da EA do que um clube sem
  // ninguém: não rebaixa todo o elenco a ex-membro.
  if (members.length === 0) return { members: 0, formerMembers: 0 };

  const currentNames = new Set(members.map((member) => member.name));
  const identities = await listPlayerIdentities(club.id);
  const formerMemberIds = identities
    .filter((player) => player.isMember && !currentNames.has(player.name))
    .map((player) => player.id);

  await markPlayersAsFormerMembers(formerMemberIds);

  return { members: members.length, formerMembers: formerMemberIds.length };
}

export interface MatchPlayerRef {
  eaPlayerId: string;
  name: string;
}

export interface ResolvedMatchPlayers {
  /** ID EA do jogador → ID do jogador no nosso banco. */
  idsByEaPlayerId: Map<string, string>;
  /** Jogadores que não puderam ser associados (conflito de nome). */
  unresolved: MatchPlayerRef[];
}

/**
 * Associa os jogadores vistos nas partidas (ID EA + gamertag) aos registros
 * do banco, criando os que ainda não existem.
 *
 * Ordem de associação: ID EA já vinculado → mesmo gamertag sem ID → novo.
 * TODO: tratar troca de gamertag (mesmo ID EA com nome diferente na lista de
 * membros gera um segundo registro hoje).
 */
export async function resolveMatchPlayers(
  clubId: string,
  refs: MatchPlayerRef[],
): Promise<ResolvedMatchPlayers> {
  const identities = await listPlayerIdentities(clubId);
  const byEaId = indexByEaPlayerId(identities);
  const byName = new Map(identities.map((player) => [player.name, player]));

  const links: { playerId: string; eaPlayerId: string }[] = [];
  const toCreate: MatchPlayerRef[] = [];
  const unresolved: MatchPlayerRef[] = [];

  for (const ref of refs) {
    if (byEaId.has(ref.eaPlayerId)) continue;

    const sameName = byName.get(ref.name);
    if (!sameName) {
      toCreate.push(ref);
    } else if (sameName.eaPlayerId === null) {
      links.push({ playerId: sameName.id, eaPlayerId: ref.eaPlayerId });
    } else {
      unresolved.push(ref);
    }
  }

  await linkEaPlayerIds(links);
  await insertPlayersFromMatches(clubId, toCreate);

  const refreshed =
    links.length > 0 || toCreate.length > 0 ? await listPlayerIdentities(clubId) : identities;

  const idsByEaPlayerId = new Map<string, string>();
  for (const [eaPlayerId, player] of indexByEaPlayerId(refreshed)) {
    idsByEaPlayerId.set(eaPlayerId, player.id);
  }

  return { idsByEaPlayerId, unresolved };
}

function indexByEaPlayerId(identities: PlayerIdentity[]): Map<string, PlayerIdentity> {
  const index = new Map<string, PlayerIdentity>();
  for (const player of identities) {
    if (player.eaPlayerId) index.set(player.eaPlayerId, player);
  }
  return index;
}
