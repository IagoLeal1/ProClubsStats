import { formatDecimal, formatPercent, formatRating } from "@/lib/format";
import type { ScoutFormat, ScoutMetric } from "@/lib/stats/scouting";
import { cn } from "@/lib/utils";

const FORMATTERS: Record<ScoutFormat, (value: number | null) => string> = {
  decimal: formatDecimal,
  percent: (value) => formatPercent(value),
  rating: formatRating,
};

/** Faixas do percentil: o número e a posição sempre aparecem junto, a cor só reforça. */
function tierClass(percentile: number): string {
  if (percentile >= 67) return "bg-primary";
  if (percentile >= 34) return "bg-[#fcd34d]";
  return "bg-loss";
}

/** Raio-X estilo Sofascore: cada número com a barra do percentil no elenco. */
export function ScoutReport({ metrics }: { metrics: ScoutMetric[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 border bg-card px-4 py-2 sm:px-5 md:grid-cols-2">
      {metrics.map((metric) => (
        <li key={metric.key} className="space-y-1.5 border-b py-3 last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold tabular">{FORMATTERS[metric.format](metric.value)}</span>
              {metric.rank && (
                <span className="w-9 text-right text-xs text-muted-foreground tabular">
                  {metric.rank.position}º/{metric.rank.total}
                </span>
              )}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface"
            role="meter"
            aria-label={`${metric.label}: percentil no elenco`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={metric.percentile === null ? undefined : Math.round(metric.percentile)}
          >
            {metric.percentile !== null && (
              <div
                className={cn("h-full rounded-full", tierClass(metric.percentile))}
                // Percentil 0 ainda mostra um toco, para não parecer dado faltando.
                style={{ width: `${Math.max(4, metric.percentile)}%` }}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
