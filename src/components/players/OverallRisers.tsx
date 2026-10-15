import Link from "next/link";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { formatSigned } from "@/lib/format";
import { overallDeltaSince, type OverallTrend } from "@/lib/stats/progress";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/player";

/** Janela de "quem mais subiu". */
export const RISERS_WINDOW_DAYS = 30;

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

interface OverallRisersProps {
  clubId: string;
  players: Player[];
  trends: Map<string, OverallTrend>;
}

/** Quem mais mudou de OVR no último mês (subidas primeiro). */
export function OverallRisers({ clubId, players, trends }: OverallRisersProps) {
  const rows = players
    .flatMap((player) => {
      const trend = trends.get(player.id);
      if (!player.isMember || !trend) return [];
      const delta = overallDeltaSince(trend, RISERS_WINDOW_DAYS);
      return delta === 0 ? [] : [{ player, trend, delta }];
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
  const trackingSince = [...trends.values()]
    .map((trend) => trend.first.capturedAt)
    .sort()[0];

  if (!trackingSince) return null;

  return (
    <section className="mb-4 flex flex-col gap-3 border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="kicker text-primary">Quem mais subiu de OVR</span>
        <span className="text-xs text-muted-foreground">últimos {RISERS_WINDOW_DAYS} dias</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguém mudou de OVR ainda. O site registra desde {shortDate.format(new Date(trackingSince))}.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ player, trend, delta }) => {
            const Icon = delta > 0 ? ArrowUpRightIcon : ArrowDownRightIcon;
            return (
              <li key={player.id} className="flex items-center justify-between gap-3">
                <Link href={`/clubs/${clubId}/players/${player.id}`} className="truncate font-semibold hover:text-primary">
                  {player.name}
                </Link>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-muted-foreground tabular">{trend.last.overall} OVR</span>
                  <span
                    className={cn(
                      "flex items-center gap-1 font-display text-base font-bold tabular",
                      delta > 0 ? "text-win" : "text-loss",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {formatSigned(delta)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
