import { ClubCrest } from "@/components/clubs/ClubCrest";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { Club } from "@/types/club";
import { MATCH_TYPE_LABELS, type MatchDetails } from "@/types/match";

import { MatchResult } from "./MatchResult";

function Side({ name, crestUrl }: { name: string; crestUrl: string | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <ClubCrest name={name} src={crestUrl} size={56} />
      <p className="line-clamp-2 font-display text-base font-bold uppercase sm:text-xl">{name}</p>
    </div>
  );
}

/** Placar da partida: nosso clube à esquerda, adversário à direita. */
export function MatchScoreboard({ club, match }: { club: Club; match: MatchDetails }) {
  return (
    <div className="border bg-card p-5 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{MATCH_TYPE_LABELS[match.matchType]}</Badge>
        <span>{formatDateTime(match.playedAt)}</span>
        {match.decidedByDnf && <Badge variant="outline">Decidida por abandono</Badge>}
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <Side name={club.name} crestUrl={club.crestUrl} />
        <div className="flex shrink-0 flex-col items-center gap-2">
          <p className="figure text-6xl sm:text-8xl">
            {match.goalsFor}
            <span className="mx-1 text-muted-foreground">–</span>
            {match.goalsAgainst}
          </p>
          <MatchResult result={match.result} />
        </div>
        <Side name={match.opponent.name} crestUrl={match.opponent.crestUrl} />
      </div>
    </div>
  );
}
