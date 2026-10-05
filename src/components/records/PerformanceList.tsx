import Link from "next/link";

import { formatDateTime } from "@/lib/format";
import type { IndividualRecord } from "@/lib/stats/records";

interface PerformanceListProps {
  title: string;
  records: IndividualRecord[];
  formatValue: (value: number) => string;
  clubId: string;
}

/** Top atuações individuais numa partida (ex.: mais gols num jogo). */
export function PerformanceList({ title, records, formatValue, clubId }: PerformanceListProps) {
  return (
    <div className="border bg-card p-4">
      <p className="kicker text-muted-foreground">{title}</p>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Sem registros ainda.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {records.map(({ stat, match, value }, index) => (
            <li key={`${stat.matchId}-${stat.playerId}`} className="flex items-center gap-3">
              <span
                className={
                  index === 0
                    ? "figure w-12 text-3xl text-primary"
                    : "figure w-12 text-2xl text-muted-foreground"
                }
              >
                {formatValue(value)}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={`/clubs/${clubId}/players/${stat.playerId}`}
                  className="block truncate font-semibold hover:text-primary"
                >
                  {stat.playerName}
                </Link>
                <Link
                  href={`/clubs/${clubId}/matches/${match.id}`}
                  className="block truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  vs {match.opponent.name} · {formatDateTime(match.playedAt)}
                </Link>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
