import "server-only";

import { getGitHubDispatchConfig } from "@/lib/env";
import type { Platform } from "@/types/club";

const WORKFLOW_FILE = "sync-clubs.yml";
const BRANCH = "main";

export function isSyncDispatchConfigured(): boolean {
  return getGitHubDispatchConfig() !== null;
}

/**
 * Pede ao GitHub Actions que sincronize um clube (workflow_dispatch).
 * Retorna false se o token não estiver configurado.
 */
export async function dispatchClubSync(eaClubId: number, platform: Platform): Promise<boolean> {
  const config = getGitHubDispatchConfig();
  if (!config) return false;

  const response = await fetch(
    `https://api.github.com/repos/${config.repository}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: BRANCH, inputs: { club_id: String(eaClubId), platform } }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub recusou o pedido de sincronização (${response.status})`);
  }
  return true;
}
