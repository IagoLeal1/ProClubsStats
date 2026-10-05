import Link from "next/link";
import { CalendarXIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchCard, MatchList } from "@/components/matches/MatchCard";
import type { Match } from "@/types/match";

export function ClubRecentMatches({ clubId, matches }: { clubId: string; matches: Match[] }) {
  return (
    <section>
      <SectionHeading
        title="Últimos jogos"
        action={
          <Link href={`/clubs/${clubId}/matches`} className="text-sm text-muted-foreground hover:text-foreground">
            Ver histórico completo
          </Link>
        }
      />
      {matches.length === 0 ? (
        <EmptyState
          icon={CalendarXIcon}
          title="Nenhuma partida salva ainda"
          description="As partidas aparecem aqui depois da sincronização. A EA disponibiliza apenas as mais recentes de cada tipo."
        />
      ) : (
        <MatchList>
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </MatchList>
      )}
    </section>
  );
}
