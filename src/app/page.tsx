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
    <Container className="space-y-14 pt-14 sm:pt-24">
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            EA SPORTS FC 27 · Pro Clubs
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">FC Clubs Stats</h1>
          <p className="text-muted-foreground">
            Estatísticas, rankings internos e o histórico completo de partidas do seu clube — salvo
            a cada sincronização, mesmo quando a EA só mostra os jogos mais recentes.
          </p>
        </div>
        <ClubSearchForm variant="hero" />
        <p className="text-xs text-muted-foreground">Dica: também é possível buscar pelo ID do clube na EA.</p>
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
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <li key={club.id}>
            <Link
              href={`/clubs/${club.id}`}
              className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent"
            >
              <ClubCrest name={club.name} src={club.crestUrl} size={40} />
              <div className="min-w-0">
                <p className="truncate font-medium">{club.name}</p>
                <p className="text-xs text-muted-foreground tabular">
                  {club.record.wins}V {club.record.draws}E {club.record.losses}D
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-18 rounded-xl" />
      ))}
    </div>
  );
}
