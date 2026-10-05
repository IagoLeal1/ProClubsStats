import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { ClubCrest } from "@/components/clubs/ClubCrest";
import { formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MATCH_TYPE_LABELS, type Match } from "@/types/match";

import { MatchResult } from "./MatchResult";

interface MatchCardProps {
  match: Match;
  /** "time": só o horário (listas de uma mesma noite). */
  dateStyle?: "full" | "time";
}

/** Linha de partida: resultado, adversário, placar. Use dentro de `MatchList`. */
export function MatchCard({ match, dateStyle = "full" }: MatchCardProps) {
  const when = dateStyle === "time" ? formatTime(match.playedAt) : formatDateTime(match.playedAt);
  return (
    <Link
      href={`/clubs/${match.clubId}/matches/${match.id}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface sm:gap-4 sm:px-5"
    >
      <MatchResult result={match.result} size="sm" />
      <ClubCrest name={match.opponent.name} src={match.opponent.crestUrl} size={28} className="max-sm:hidden" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{match.opponent.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {MATCH_TYPE_LABELS[match.matchType]} · {when}
          {match.decidedByDnf && " · abandono"}
        </span>
      </span>
      <span className="figure text-2xl sm:text-3xl">
        {match.goalsFor}–{match.goalsAgainst}
      </span>
      <ChevronRightIcon
        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

/** Moldura das listas de partidas (linhas divididas). */
export function MatchList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("divide-y border bg-card", className)}>{children}</div>;
}
