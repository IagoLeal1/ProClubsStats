import type { Metadata } from "next";
import Link from "next/link";
import { CalendarXIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchCard } from "@/components/matches/MatchCard";
import { SessionHeader } from "@/components/matches/SessionHeader";
import { buttonVariants } from "@/components/ui/button";
import { listAllClubMatches } from "@/lib/db/matches.repository";
import { formatInteger } from "@/lib/format";
import { groupSessions } from "@/lib/stats/sessions";
import { cn } from "@/lib/utils";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Partidas" };

/** Noites de jogo por página. */
const SESSIONS_PER_PAGE = 5;

const searchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export default async function ClubMatchesPage({
  params,
  searchParams,
}: PageProps<"/clubs/[clubId]/matches">) {
  const [{ clubId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const club = await loadClub(clubId);
  const { page } = searchParamsSchema.parse(rawSearchParams);

  const matches = await listAllClubMatches(club.id);
  if (matches.length === 0) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="Nenhuma partida no histórico"
        description="Cada sincronização salva as partidas recentes da EA. Com o tempo, este histórico cresce além do que a EA mostra."
      />
    );
  }

  const sessions = groupSessions(matches).reverse();
  const totalPages = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));
  const visible = sessions.slice((page - 1) * SESSIONS_PER_PAGE, page * SESSIONS_PER_PAGE);
  const pageHref = (target: number) => `/clubs/${club.id}/matches?page=${target}`;

  return (
    <section>
      <SectionHeading
        title="Histórico de partidas"
        description={`${formatInteger(matches.length)} partidas em ${formatInteger(sessions.length)} ${
          sessions.length === 1 ? "noite" : "noites"
        } · liga, playoffs e amistosos`}
      />

      {visible.length > 0 ? (
        <div className="space-y-8">
          {visible.map((session) => (
            <div key={session.id} className="space-y-3">
              <SessionHeader clubId={club.id} session={session} />
              <div className="space-y-2">
                {[...session.matches].reverse().map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Página sem partidas.</p>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-8 flex items-center justify-between gap-3">
          <PageLink href={pageHref(page - 1)} disabled={page <= 1}>
            <ChevronLeftIcon data-icon="inline-start" /> Mais recentes
          </PageLink>
          <span className="text-sm text-muted-foreground tabular">
            Página {page} de {totalPages}
          </span>
          <PageLink href={pageHref(page + 1)} disabled={page >= totalPages}>
            Mais antigas <ChevronRightIcon data-icon="inline-end" />
          </PageLink>
        </nav>
      )}
    </section>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  const className = cn(buttonVariants({ variant: "outline" }), disabled && "pointer-events-none opacity-50");
  if (disabled) {
    return (
      <span aria-disabled className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
