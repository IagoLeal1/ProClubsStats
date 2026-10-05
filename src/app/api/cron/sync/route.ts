import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { listClubsDueForSync } from "@/lib/db/clubs.repository";
import { getCronSecret } from "@/lib/env";
import { getUserMessage, logServerError } from "@/lib/errors";
import { syncClub } from "@/services/sync/sync.service";

/**
 * Sincronização periódica. Chamado pelo GitHub Actions a cada 30 min
 * (.github/workflows/sync-clubs.yml) e pelo Vercel Cron 1×/dia (vercel.json).
 * Como a EA só expõe as 10 últimas partidas por tipo, rodar com frequência
 * evita perder jogos. Ambos enviam `Authorization: Bearer <CRON_SECRET>`.
 */
export const maxDuration = 60;

const CLUBS_PER_RUN = 5;
/** Menor que o intervalo do agendador (30 min) para nenhuma rodada pular o clube. */
const STALE_AFTER_MS = 20 * 60 * 1000;

function isAuthorized(request: NextRequest, secret: string): boolean {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: NextRequest) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 503 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const syncedBefore = new Date(Date.now() - STALE_AFTER_MS).toISOString();
    const clubs = await listClubsDueForSync(syncedBefore, CLUBS_PER_RUN);

    const results = [];
    // Sequencial de propósito: não disparar rajadas de requisições contra a EA.
    for (const club of clubs) {
      try {
        const result = await syncClub(club.eaClubId, club.platform, { force: true });
        results.push({
          clubId: club.id,
          newMatches: result.matches?.newMatches ?? 0,
          warnings: result.warnings,
        });
      } catch (error) {
        logServerError(`cron:sync:${club.id}`, error);
        results.push({ clubId: club.id, error: getUserMessage(error) });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    logServerError("cron:sync", error);
    return NextResponse.json({ error: getUserMessage(error) }, { status: 500 });
  }
}
