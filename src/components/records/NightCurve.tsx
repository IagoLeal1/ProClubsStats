import { SeriesChart, type SeriesChartPoint } from "@/components/charts/SeriesChart";
import { formatPercent } from "@/lib/format";
import { LAST_GAME_BUCKET, type NightCurve as NightCurveData, type NightSlice } from "@/lib/stats/night-curve";

/** Diferença de aproveitamento (em pontos) a partir da qual o time "cai" ou "cresce". */
const VERDICT_GAP = 10;
/** Com menos noites que isso, o retrato ainda é frágil. */
const RELIABLE_NIGHTS = 3;

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const ordinal = (order: number) => (order >= LAST_GAME_BUCKET ? `${order}º+` : `${order}º`);
const recordLabel = (slice: NightSlice) => `${slice.wins}V ${slice.draws}E ${slice.losses}D`;

function verdict(first: NightSlice, second: NightSlice): string {
  const gap = second.pointsRate - first.pointsRate;
  if (gap <= -VERDICT_GAP) return "Vocês caem no fim da noite.";
  if (gap >= VERDICT_GAP) return "Vocês crescem no fim da noite.";
  return "Ritmo parecido do começo ao fim da noite.";
}

function HalfStat({ label, slice }: { label: string; slice: NightSlice }) {
  return (
    <div className="flex flex-col gap-1 border bg-card p-4">
      <span className="kicker text-muted-foreground">{label}</span>
      <span className="figure text-4xl">{formatPercent(slice.pointsRate)}</span>
      <span className="text-xs text-muted-foreground">
        {recordLabel(slice)} em {plural(slice.games, "jogo", "jogos")}
      </span>
    </div>
  );
}

/** Aproveitamento do clube do 1º ao último jogo da noite. */
export function NightCurve({ curve }: { curve: NightCurveData }) {
  const { firstHalf, secondHalf, overall } = curve;
  const points: SeriesChartPoint[] = curve.buckets.map((bucket) => ({
    key: String(bucket.order),
    value: bucket.pointsRate,
    axisLabel: `${ordinal(bucket.order)} jogo`,
    title: bucket.order >= LAST_GAME_BUCKET ? `Do ${bucket.order}º jogo em diante` : `${bucket.order}º jogo da noite`,
    details: [
      `${recordLabel(bucket)} · ${plural(bucket.games, "jogo", "jogos")}`,
      `${bucket.goalsFor} gols pró, ${bucket.goalsAgainst} contra`,
    ],
  }));

  return (
    <div className="space-y-3">
      {firstHalf && secondHalf && (
        <>
          <p className="font-semibold">{verdict(firstHalf, secondHalf)}</p>
          <div className="grid grid-cols-2 gap-3">
            <HalfStat label="1ª metade da noite" slice={firstHalf} />
            <HalfStat label="2ª metade da noite" slice={secondHalf} />
          </div>
        </>
      )}

      <div className="border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold tracking-[0.06em] uppercase">Aproveitamento por jogo</h3>
          <p className="text-xs text-muted-foreground">linha = média</p>
        </div>
        <SeriesChart
          points={points}
          variant="bar"
          valueFormat="percent"
          domain={[0, 100]}
          tickStep={25}
          reference={overall ? { value: overall.pointsRate, label: `média ${formatPercent(overall.pointsRate)}` } : null}
          ariaLabel="Aproveitamento do clube conforme a ordem do jogo na noite"
        />
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver em tabela</summary>
          <table className="mt-2 w-full tabular">
            <thead className="kicker text-left text-muted-foreground">
              <tr>
                <th className="py-1.5 font-semibold">Jogo</th>
                <th className="py-1.5 text-right font-semibold">V-E-D</th>
                <th className="py-1.5 text-right font-semibold">Aprov.</th>
              </tr>
            </thead>
            <tbody>
              {curve.buckets.map((bucket) => (
                <tr key={bucket.order} className="border-t">
                  <td className="py-1.5">{ordinal(bucket.order)}</td>
                  <td className="py-1.5 text-right">
                    {bucket.wins}-{bucket.draws}-{bucket.losses}
                  </td>
                  <td className="py-1.5 text-right">{formatPercent(bucket.pointsRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      {curve.nights < RELIABLE_NIGHTS && (
        <p className="text-xs text-muted-foreground">
          Só {plural(curve.nights, "noite salva", "noites salvas")} até agora: o retrato fica mais confiável
          com o tempo.
        </p>
      )}
    </div>
  );
}
