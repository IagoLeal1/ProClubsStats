import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { ClubCrest } from "@/components/clubs/ClubCrest";
import { ClubSearchForm } from "@/components/clubs/ClubSearchForm";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { listRecentlySyncedClubs } from "@/lib/db/clubs.repository";
import { logServerError } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";
import type { Club } from "@/types/club";

export default function HomePage() {
  return (
    <Container className="space-y-16 pt-14 sm:pt-24">
      <section className="relative mx-auto max-w-3xl space-y-7 text-center">
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[520px] -translate-1/2 rounded-full border-2 border-[#191b20]" />
        <div className="space-y-4">
          <p className="kicker text-primary">EA SPORTS FC 27 · Pro Clubs</p>
          <h1 className="figure text-6xl uppercase sm:text-8xl">FC Clubs Stats</h1>
          <p className="mx-auto max-w-xl text-muted-foreground sm:text-lg">
            Estatísticas, rankings internos e o histórico completo de partidas do seu clube — salvo
            a cada sincronização, mesmo quando a EA só mostra os jogos mais recentes.
          </p>
        </div>
        <ClubSearchForm variant="hero" />
        <p className="text-sm text-muted-foreground">Dica: também dá para buscar pelo ID do clube na EA.</p>
      </section>

      <Suspense fallback={<RecentClubsSkeleton />}>
        <RecentClubs />
      </Suspense>
    </Container>
  );
}

async function RecentClubs() {
  await connection();

  let clubs: Club[] = [];
  try {
    clubs = await listRecentlySyncedClubs(6);
  } catch (error) {
    // A home continua funcionando (busca na EA) mesmo sem banco.
    logServerError("home:recentClubs", error);
  }

  if (clubs.length === 0) return null;

  return (
    <section>
      <SectionHeading title="Atualizados recentemente" />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <li key={club.id}>
            <Link
              href={`/clubs/${club.id}`}
              className="flex items-center gap-3 border bg-card p-4 transition-colors hover:bg-surface"
            >
              <ClubCrest name={club.name} src={club.crestUrl} size={40} />
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-bold uppercase">{club.name}</p>
                <p className="text-sm text-muted-foreground tabular">
                  <span className="text-win">{club.record.wins}V</span>{" "}
                  <span className="text-draw">{club.record.draws}E</span>{" "}
                  <span className="text-loss">{club.record.losses}D</span>
                  {club.lastSyncedAt && ` · ${formatRelativeTime(club.lastSyncedAt)}`}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentClubsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-18 rounded-sm" />
      ))}
    </div>
  );
}
