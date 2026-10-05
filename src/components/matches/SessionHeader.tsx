import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { formatTime, formatWeekdayDate } from "@/lib/format";
import type { GameSession } from "@/lib/stats/sessions";

interface SessionHeaderProps {
  clubId: string;
  session: GameSession;
}

/** Cabeçalho de uma noite de jogos na lista de partidas. */
export function SessionHeader({ clubId, session }: SessionHeaderProps) {
  const { record } = session;
  const games = session.matches.length;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-2xl leading-tight font-bold uppercase">
          {formatWeekdayDate(session.startedAt)}
        </h3>
        <p className="text-sm text-muted-foreground tabular">
          {formatTime(session.startedAt)}–{formatTime(session.endedAt)} · {games}{" "}
          {games === 1 ? "partida" : "partidas"} ·{" "}
          <span className="text-win">{record.wins}V</span> <span className="text-draw">{record.draws}E</span>{" "}
          <span className="text-loss">{record.losses}D</span> · {record.goalsFor}–{record.goalsAgainst}
        </p>
      </div>
      <Link
        href={`/clubs/${clubId}/sessions/${session.id}`}
        className="flex h-10 items-center gap-2 border border-input px-4 font-display text-sm font-bold tracking-[0.08em] uppercase transition-colors hover:border-primary hover:text-primary"
      >
        Resumo da noite <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
