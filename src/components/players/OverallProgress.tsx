import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { SeriesChart, type SeriesChartPoint } from "@/components/charts/SeriesChart";
import { formatDateTime, formatSigned } from "@/lib/format";
import { roundedScale } from "@/lib/stats/chart-scale";
import type { OverallTrend } from "@/lib/stats/progress";
import { cn } from "@/lib/utils";

const axisDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

function toChartPoints(trend: OverallTrend): SeriesChartPoint[] {
  return trend.points.map((point) => ({
    key: `${point.gamesPlayed}`,
    value: point.overall,
    axisLabel: axisDate.format(new Date(point.capturedAt)),
    title: formatDateTime(point.capturedAt),
    details: [`${point.gamesPlayed} jogos no clube`],
  }));
}

/** Evolução do OVR do Pro, registrada pelo site a cada sincronização. */
export function OverallProgress({ trend }: { trend: OverallTrend }) {
  const { first, last, delta } = trend;
  const since = axisDate.format(new Date(first.capturedAt));
  const changed = new Set(trend.points.map((point) => point.overall)).size > 1;
  const Icon = delta >= 0 ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <section className="flex flex-col gap-3 border bg-card p-5 sm:p-6">
      <span className="kicker text-primary">Evolução do Pro</span>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="figure text-6xl">{last.overall}</span>
        <span className="font-display text-lg font-bold tracking-[0.06em] text-muted-foreground uppercase">OVR</span>
        {changed && delta !== 0 ? (
          <span className={cn("flex items-center gap-1 text-sm font-semibold", delta > 0 ? "text-win" : "text-loss")}>
            <Icon className="size-4" aria-hidden />
            {formatSigned(delta)} desde {since}
          </span>
        ) : (
          changed && <span className="text-sm text-muted-foreground">igual a {since}, com altos e baixos</span>
        )}
      </div>

      {changed ? (
        <SeriesChart
          points={toChartPoints(trend)}
          valueFormat="integer"
          variant="line"
          ariaLabel={`OVR de ${first.overall} para ${last.overall} desde ${since}`}
          {...roundedScale(
            trend.points.map((point) => point.overall),
            2,
          )}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          O site registra o OVR a cada sincronização desde {since}. A EA só informa o valor atual: o
          gráfico aparece quando ele mudar.
        </p>
      )}
    </section>
  );
}
