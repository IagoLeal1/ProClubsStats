import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { MatchResult } from "@/components/matches/MatchResult";
import { formatRating, formatTime, formatWeekdayDate } from "@/lib/format";
import type { GameSession, SessionSummary } from "@/lib/stats/sessions";

interface LastSessionCardProps {
  clubId: string;
  session: GameSession;
  summary: SessionSummary;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Destaque do dashboard: campanha e destaques da noite mais recente. */
export function LastSessionCard({ clubId, session, summary }: LastSessionCardProps) {
  const { record } = session;
  const highlights = [
    summary.mvp && {
      label: "MVP da noite",
      name: summary.mvp.playerName,
      detail: `${summary.mvp.mvps}× MVP · nota ${formatRating(summary.mvp.averageRating)}`,
    },
    summary.topScorer && {
      label: "Artilheiro",
      name: summary.topScorer.playerName,
      detail: plural(summary.topScorer.goals, "gol", "gols"),
    },
    summary.topAssister && {
      label: "Garçom",
      name: summary.topAssister.playerName,
      detail: plural(summary.topAssister.assists, "assistência", "assistências"),
    },
  ].filter((highlight): highlight is { label: string; name: string; detail: string } => Boolean(highlight));

  return (
    <article className="border bg-card">
      <div className="h-1 bg-primary" />
      <div className="flex flex-col gap-6 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="kicker text-primary">Última noite</span>
            <span className="font-display text-3xl leading-none font-bold uppercase">
              {formatWeekdayDate(session.startedAt)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatTime(session.startedAt)}–{formatTime(session.endedAt)} ·{" "}
              {plural(session.matches.length, "partida", "partidas")} · {record.goalsFor} gols feitos,{" "}
              {record.goalsAgainst} sofridos
            </span>
          </div>
          <Link
            href={`/clubs/${clubId}/sessions/${session.id}`}
            className="clip-slant flex h-11 items-center gap-2 bg-primary px-5 font-display text-base font-extrabold tracking-[0.08em] text-primary-foreground uppercase transition-opacity hover:opacity-90"
          >
            Resumo da noite <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>

        <p className="figure flex flex-wrap items-baseline gap-x-5 text-7xl sm:text-[5.5rem]">
          <span className="text-win">{record.wins}V</span>
          <span className="text-draw">{record.draws}E</span>
          <span className="text-loss">{record.losses}D</span>
        </p>

        <div className="flex flex-wrap gap-1.5" aria-label="Resultados da noite em ordem">
          {session.matches.map((match) => (
            <MatchResult key={match.id} result={match.result} />
          ))}
        </div>

        {highlights.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {highlights.map((highlight) => (
              <div key={highlight.label} className="flex flex-col gap-1 rounded-sm bg-surface p-4">
                <span className="kicker text-muted-foreground">{highlight.label}</span>
                <span className="truncate font-display text-2xl leading-tight font-bold">{highlight.name}</span>
                <span className="text-sm text-primary">{highlight.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
