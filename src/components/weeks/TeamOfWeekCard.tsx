import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { RatingBadge } from "@/components/players/RatingBadge";
import { formatPositionGroupShort, formatRating } from "@/lib/format";
import { formatWeekRange, type GameWeek, type TeamOfTheWeek } from "@/lib/stats/weeks";

interface TeamOfWeekCardProps {
  clubId: string;
  week: GameWeek;
  team: TeamOfTheWeek;
}

/** Destaque do dashboard: craque e titulares da semana mais recente. */
export function TeamOfWeekCard({ clubId, week, team }: TeamOfWeekCardProps) {
  const { star } = team;
  const profile = (playerId: string) => `/clubs/${clubId}/players/${playerId}`;
  const others = team.lineup.filter((line) => line.playerId !== star?.playerId);

  return (
    <section className="flex flex-col gap-4 border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="kicker text-primary">Time da semana</span>
        <span className="text-sm text-muted-foreground tabular">{formatWeekRange(week.id)}</span>
      </div>

      {star && (
        <Link
          href={profile(star.playerId)}
          className="flex items-center gap-4 bg-primary px-4 py-3.5 text-primary-foreground transition-opacity hover:opacity-95"
        >
          <span className="figure text-4xl">{formatRating(star.averageRating)}</span>
          <span className="flex min-w-0 flex-col">
            <span className="kicker">Craque da semana</span>
            <span className="truncate font-display text-2xl leading-tight font-bold">{star.playerName}</span>
          </span>
        </Link>
      )}

      {others.length > 0 && (
        <ul className="space-y-2">
          {others.map((line) => (
            <li key={line.playerId} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-8 shrink-0 font-display text-sm font-bold text-muted-foreground">
                  {formatPositionGroupShort(line.position)}
                </span>
                <Link href={profile(line.playerId)} className="truncate font-semibold hover:text-primary">
                  {line.playerName}
                </Link>
              </span>
              <RatingBadge rating={line.averageRating} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/clubs/${clubId}/team-of-the-week/${week.id}`}
        className="inline-flex items-center gap-1.5 self-start font-display text-base font-bold tracking-[0.08em] text-primary uppercase hover:underline"
      >
        Ver o time <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
