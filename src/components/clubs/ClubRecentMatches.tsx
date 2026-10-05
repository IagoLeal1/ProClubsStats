import Link from "next/link";
import { CalendarXIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/EmptyState";
import { MatchCard } from "@/components/matches/MatchCard";
import { MatchResult } from "@/components/matches/MatchResult";
import { buttonVariants } from "@/components/ui/button";
import type { Match } from "@/types/match";

interface ClubRecentMatchesProps {
  clubId: string;
  matches: Match[];
  /** Quantos resultados aparecem na sequência "W W D L W". */
  formSize?: number;
}

export function ClubRecentMatches({ clubId, matches, formSize = 5 }: ClubRecentMatchesProps) {
  if (matches.length === 0) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="Nenhuma partida salva ainda"
        description="As partidas aparecem aqui depois da sincronização. A EA disponibiliza apenas as mais recentes de cada tipo."
      />
    );
  }

  const form = matches.slice(0, formSize);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" aria-label="Sequência dos últimos jogos">
          {form.map((match) => (
            <MatchResult key={match.id} result={match.result} size="sm" />
          ))}
        </div>
        <Link
          href={`/clubs/${clubId}/matches`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Ver todas
        </Link>
      </div>
      <div className="space-y-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
