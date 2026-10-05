import type { Metadata } from "next";
import Link from "next/link";
import { CalendarXIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchCard } from "@/components/matches/MatchCard";
import { buttonVariants } from "@/components/ui/button";
import { listMatchesPage } from "@/lib/db/matches.repository";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Partidas" };

const PAGE_SIZE = 20;

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

  const { matches, total } = await listMatchesPage(club.id, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total === 0) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="Nenhuma partida no histórico"
        description="Cada sincronização salva as partidas recentes da EA. Com o tempo, este histórico cresce além do que a EA mostra."
      />
    );
  }

  return (
    <section>
      <SectionHeading
        title="Histórico de partidas"
        description={`${formatInteger(total)} partidas salvas · liga, playoffs e amistosos`}
      />

      {matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Página sem partidas.</p>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-3">
          <PageLink href={`/clubs/${club.id}/matches?page=${page - 1}`} disabled={page <= 1}>
            <ChevronLeftIcon data-icon="inline-start" /> Anteriores
          </PageLink>
          <span className="text-sm text-muted-foreground tabular">
            Página {page} de {totalPages}
          </span>
          <PageLink href={`/clubs/${club.id}/matches?page=${page + 1}`} disabled={page >= totalPages}>
            Próximas <ChevronRightIcon data-icon="inline-end" />
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
