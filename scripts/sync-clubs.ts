/**
 * Sincronização fora da Vercel (a EA bloqueia os IPs da Vercel/AWS).
 * Roda no GitHub Actions (.github/workflows/sync-clubs.yml) ou localmente:
 *
 *   npm run sync                         # clubes com dados velhos
 *   CLUB_ID=1045154 npm run sync         # um clube (também adiciona clube novo)
 *   CLUB_ID=123 PLATFORM=switch npm run sync
 *
 * Precisa de NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e
 * SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */
import { z } from "zod";

import { listClubsDueForSync } from "@/lib/db/clubs.repository";
import { getUserMessage } from "@/lib/errors";
import { syncClub } from "@/services/sync/sync.service";
import { PLATFORMS, type Platform } from "@/types/club";

/** Menor que o intervalo do agendamento (15 min) para nenhuma rodada pular um clube. */
const STALE_AFTER_MS = 10 * 60 * 1000;
const CLUBS_PER_RUN = 20;

const envSchema = z.object({
  CLUB_ID: z
    .string()
    .trim()
    .regex(/^\d{1,12}$/, "CLUB_ID deve ser o ID numérico do clube na EA")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  PLATFORM: z
    .enum(PLATFORMS)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

async function syncOne(eaClubId: number, platform: Platform): Promise<boolean> {
  try {
    const result = await syncClub(eaClubId, platform, { force: true });
    const newMatches = result.matches?.newMatches ?? 0;
    console.log(`✓ ${result.club.name} (${eaClubId}): ${newMatches} partida(s) nova(s)`);
    for (const warning of result.warnings) console.log(`  ⚠ ${warning}`);
    return true;
  } catch (error) {
    console.error(`✗ clube ${eaClubId}: ${getUserMessage(error)}`, error);
    return false;
  }
}

async function main() {
  const env = envSchema.parse(process.env);

  if (env.CLUB_ID) {
    const ok = await syncOne(Number(env.CLUB_ID), env.PLATFORM ?? "crossplay");
    process.exit(ok ? 0 : 1);
  }

  const syncedBefore = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const clubs = await listClubsDueForSync(syncedBefore, CLUBS_PER_RUN);
  if (clubs.length === 0) {
    console.log("Nenhum clube precisando de sincronização.");
    return;
  }

  let failures = 0;
  // Sequencial de propósito: não disparar rajadas de requisições contra a EA.
  for (const club of clubs) {
    if (!(await syncOne(club.eaClubId, club.platform))) failures++;
  }
  console.log(`${clubs.length - failures}/${clubs.length} clube(s) sincronizado(s).`);
  if (failures === clubs.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
