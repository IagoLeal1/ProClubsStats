import { LineChart, type LineChartPoint } from "@/components/charts/LineChart";
import { formatDateTime, formatInteger, formatSigned } from "@/lib/format";
import { roundedScale } from "@/lib/stats/chart-scale";
import type { ClubProgressPoint } from "@/types/club";

const axisDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

type RatedPoint = ClubProgressPoint & { skillRating: number };

function toChartPoints(points: RatedPoint[]): LineChartPoint[] {
  return points.map((point) => ({
    key: `${point.record.gamesPlayed}`,
    value: point.skillRating,
    axisLabel: axisDate.format(new Date(point.capturedAt)),
    title: formatDateTime(point.capturedAt),
    details: [
      `${point.record.gamesPlayed} jogos · ${point.record.wins}V ${point.record.draws}E ${point.record.losses}D`,
    ],
  }));
}

/** Evolução do skill rating (registrada pelo FC Clubs Stats a cada jogo de liga). */
export function ClubProgress({ points }: { points: ClubProgressPoint[] }) {
  const rated = points.filter((point): point is RatedPoint => point.skillRating !== null);
  const first = rated[0];
  const last = rated.at(-1);

  if (!first || !last) {
    return <p className="text-sm text-muted-foreground">Ainda sem registros de skill rating.</p>;
  }

  const change = last.skillRating - first.skillRating;

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm">
          <span className="text-2xl font-semibold">{formatInteger(last.skillRating)}</span>
          {rated.length > 1 && (
            <span className="ml-2 text-muted-foreground">
              {formatSigned(change)} desde {axisDate.format(new Date(first.capturedAt))}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {rated.length} {rated.length === 1 ? "registro" : "registros"} · um a cada jogo de liga
        </p>
      </div>

      {rated.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Começamos a registrar em {formatDateTime(first.capturedAt)}. A EA só informa o valor
          atual, então o gráfico aparece a partir da próxima partida de liga.
        </p>
      ) : (
        <LineChart
          points={toChartPoints(rated)}
          valueFormat="integer"
          ariaLabel={`Skill rating de ${formatInteger(first.skillRating)} para ${formatInteger(last.skillRating)}`}
          {...roundedScale(
            rated.map((point) => point.skillRating),
            50,
          )}
        />
      )}
    </div>
  );
}
