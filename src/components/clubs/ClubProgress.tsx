import { SeriesChart, type SeriesChartPoint } from "@/components/charts/SeriesChart";
import { formatDateTime, formatInteger, formatSigned } from "@/lib/format";
import { roundedScale } from "@/lib/stats/chart-scale";
import type { ClubProgressPoint } from "@/types/club";

const axisDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

type RatedPoint = ClubProgressPoint & { skillRating: number };

function toChartPoints(points: RatedPoint[]): SeriesChartPoint[] {
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
    <section className="flex flex-col gap-3 border bg-card p-5 sm:p-6">
      <span className="kicker text-primary">Evolução do skill rating</span>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="figure text-6xl">{formatInteger(last.skillRating)}</span>
        {rated.length > 1 && (
          <span className="text-sm text-muted-foreground">
            {formatSigned(change)} desde {axisDate.format(new Date(first.capturedAt))}
          </span>
        )}
      </div>

      {rated.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Registrando desde {axisDate.format(new Date(first.capturedAt))}. A EA só informa o valor
          atual — o gráfico aparece a partir do próximo jogo de liga.
        </p>
      ) : (
        <SeriesChart
          points={toChartPoints(rated)}
          valueFormat="integer"
          variant="line"
          ariaLabel={`Skill rating de ${formatInteger(first.skillRating)} para ${formatInteger(last.skillRating)}`}
          {...roundedScale(
            rated.map((point) => point.skillRating),
            50,
          )}
        />
      )}
    </section>
  );
}
