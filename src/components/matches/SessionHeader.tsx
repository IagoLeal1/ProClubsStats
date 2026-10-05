import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatTime, formatWeekdayDate } from "@/lib/format";
import type { GameSession } from "@/lib/stats/sessions";

interface SessionHeaderProps {
  clubId: string;
  session: GameSession;
  /** Título alternativo (ex.: "Última noite"). */
  label?: string;
}

/** Cabeçalho de uma noite de jogos com link para o resumo. */
export function SessionHeader({ clubId, session, label }: SessionHeaderProps) {
  const { record } = session;
  const games = session.matches.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {label && <p className="text-xs font-medium text-primary">{label}</p>}
        <h3 className="font-medium capitalize">{formatWeekdayDate(session.startedAt)}</h3>
        <p className="text-xs text-muted-foreground tabular">
          {formatTime(session.startedAt)}–{formatTime(session.endedAt)} · {games}{" "}
          {games === 1 ? "partida" : "partidas"} · {record.wins}V {record.draws}E {record.losses}D ·{" "}
          {record.goalsFor}–{record.goalsAgainst}
        </p>
      </div>
      <Link
        href={`/clubs/${clubId}/sessions/${session.id}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Resumo da noite <ArrowRightIcon data-icon="inline-end" />
      </Link>
    </div>
  );
}
