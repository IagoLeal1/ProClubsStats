import { formatPercent } from "@/lib/format";
import type { RecordSlice } from "@/lib/stats/sessions";
import { cn } from "@/lib/utils";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Aproveitamento grande + campanha de um recorte de partidas. */
export function SliceStat({ label, slice, className }: { label: string; slice: RecordSlice; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 border bg-card p-4", className)}>
      <span className="kicker text-muted-foreground">{label}</span>
      <span className="figure text-4xl">{formatPercent(slice.pointsRate)}</span>
      <span className="text-xs text-muted-foreground">
        {slice.wins}V {slice.draws}E {slice.losses}D em {plural(slice.games, "jogo", "jogos")}
      </span>
    </div>
  );
}
