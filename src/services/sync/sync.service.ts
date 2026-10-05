import "server-only";

import { findClubByEaId } from "@/lib/db/clubs.repository";
import { isEAError } from "@/lib/ea";
import { getUserMessage, logServerError } from "@/lib/errors";
import { dispatchClubSync } from "@/lib/github/dispatch";
import type { Club, Platform } from "@/types/club";
import { MATCH_TYPE_LABELS } from "@/types/match";

import { syncClubProfile } from "./club-sync.service";
import { syncClubMatches, type MatchSyncResult } from "./match-sync.service";
import { syncClubPlayers, type PlayerSyncResult } from "./player-sync.service";

/**
 * Intervalo mínimo entre sincronizações do mesmo clube. Evita martelar a EA
 * (que pode bloquear nosso IP) quando alguém clica várias vezes.
 */
export const MIN_SYNC_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Dados mais velhos que isso disparam sincronização automática ao abrir o
 * clube. Maior que o intervalo do agendamento (15 min) no GitHub Actions, para
 * a abertura só agir quando o agendamento atrasar.
 */
export const AUTO_SYNC_AFTER_MS = 20 * 60 * 1000;

export interface SyncResult {
  club: Club;
  /** false quando a sincronização foi pulada por ter rodado há pouco. */
  synced: boolean;
  players: PlayerSyncResult | null;
  matches: MatchSyncResult | null;
  /** Avisos de dados parciais, em linguagem de usuário. */
  warnings: string[];
}

async function runStep<T>(
  label: string,
  step: () => Promise<T>,
  warnings: string[],
): Promise<T | null> {
  try {
    return await step();
  } catch (error) {
    logServerError(`sync:${label}`, error);
    warnings.push(`Não foi possível atualizar ${label}. ${getUserMessage(error)}`);
    return null;
  }
}

function collectMatchWarnings(result: MatchSyncResult): string[] {
  const warnings: string[] = [];
  if (result.failedTypes.length > 0) {
    const labels = result.failedTypes.map((type) => MATCH_TYPE_LABELS[type]).join(", ");
    warnings.push(`Partidas de ${labels} não puderam ser buscadas agora.`);
  }
  if (result.skipped > 0) {
    warnings.push(`${result.skipped} partida(s) da EA vieram em formato inesperado e foram ignoradas.`);
  }
  if (result.unresolvedPlayers > 0) {
    warnings.push(
      `${result.unresolvedPlayers} jogador(es) não puderam ser associados às estatísticas das partidas.`,
    );
  }
  return warnings;
}

function syncedWithin(club: Club, intervalMs: number, now = Date.now()): boolean {
  if (!club.lastSyncedAt) return false;
  return now - new Date(club.lastSyncedAt).getTime() < intervalMs;
}

export const isRecentlySynced = (club: Club) => syncedWithin(club, MIN_SYNC_INTERVAL_MS);

export const needsAutoSync = (club: Club) => !syncedWithin(club, AUTO_SYNC_AFTER_MS);

/**
 * Fluxo completo e idempotente:
 *   clube (obrigatório) → jogadores → partidas + estatísticas individuais.
 * Falhas em jogadores/partidas não abortam: viram avisos (dados parciais).
 */
export async function syncClub(
  eaClubId: number,
  platform: Platform,
  options: { force?: boolean } = {},
): Promise<SyncResult> {
  if (!options.force) {
    const stored = await findClubByEaId(eaClubId, platform);
    if (stored && isRecentlySynced(stored)) {
      return { club: stored, synced: false, players: null, matches: null, warnings: [] };
    }
  }

  const syncedAt = new Date().toISOString();
  const club = await syncClubProfile(eaClubId, platform, syncedAt);

  const warnings: string[] = [];
  // Jogadores antes das partidas: as partidas são vinculadas pelos membros salvos.
  const players = await runStep("os jogadores", () => syncClubPlayers(club, syncedAt), warnings);
  const matches = await runStep("as partidas", () => syncClubMatches(club), warnings);
  if (matches) warnings.push(...collectMatchWarnings(matches));

  return { club, synced: true, players, matches, warnings };
}

export type SyncRequest = { status: "synced"; result: SyncResult } | { status: "queued" };

/**
 * Sincroniza aqui mesmo; se a EA bloquear este servidor (caso da Vercel),
 * pede a sincronização ao GitHub Actions, que a EA aceita.
 */
export async function requestClubSync(eaClubId: number, platform: Platform): Promise<SyncRequest> {
  try {
    return { status: "synced", result: await syncClub(eaClubId, platform) };
  } catch (error) {
    if (!isEAError(error) || error.kind !== "blocked") throw error;
    if (!(await dispatchClubSync(eaClubId, platform))) throw error;
    return { status: "queued" };
  }
}

/** Último pedido em segundo plano por clube (nesta instância do servidor). */
const backgroundRequests = new Map<string, number>();

/** Para rodar depois da resposta (`after`): nunca lança, só registra no log. */
export async function syncClubInBackground(club: Club): Promise<void> {
  const last = backgroundRequests.get(club.id) ?? 0;
  if (Date.now() - last < AUTO_SYNC_AFTER_MS) return;
  backgroundRequests.set(club.id, Date.now());

  try {
    await requestClubSync(club.eaClubId, club.platform);
  } catch (error) {
    logServerError("sync:background", error);
  }
}
