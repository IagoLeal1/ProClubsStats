import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { ClubCrest } from "@/components/clubs/ClubCrest";
import { formatDateTime } from "@/lib/format";
import { MATCH_TYPE_LABELS, type Match } from "@/types/match";

import { MatchResult } from "./MatchResult";

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/clubs/${match.clubId}/matches/${match.id}`}
      className="group flex items-center gap-3 rounded-xl bg-card px-3 py-3 ring-1 ring-foreground/10 transition-colors hover:bg-accent sm:px-4"
    >
      <MatchResult result={match.result} />
      <ClubCrest name={match.opponent.name} src={match.opponent.crestUrl} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <span className="text-muted-foreground">vs </span>
          {match.opponent.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {MATCH_TYPE_LABELS[match.matchType]} · {formatDateTime(match.playedAt)}
          {match.decidedByDnf && " · abandono"}
        </p>
      </div>
      <p className="text-lg font-semibold tabular">
        {match.goalsFor}
        <span className="mx-1 text-muted-foreground">–</span>
        {match.goalsAgainst}
      </p>
      <ChevronRightIcon
        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
