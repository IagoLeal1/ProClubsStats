import { formatPercent, formatPositionGroup, formatPositionGroupPlace, formatRating } from "@/lib/format";
import { bestPosition, type PositionSplit } from "@/lib/stats/positions";
import { cn } from "@/lib/utils";
import type { PositionGroup } from "@/types/player";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Ex.: "Rende mais no meio-campo (7,3) do que na defesa (6,3)." */
function verdict(splits: PositionSplit[], best: PositionGroup): string {
  const top = splits.find((split) => split.position === best);
  const others = splits
    .filter((split) => split.position !== best && split.averageRating !== null)
    .sort((a, b) => (a.averageRating ?? 0) - (b.averageRating ?? 0));
  const worst = others[0];
  if (!top || !worst) return "";
  return `Rende mais ${formatPositionGroupPlace(best)} (${formatRating(top.averageRating)}) do que ${formatPositionGroupPlace(worst.position)} (${formatRating(worst.averageRating)}).`;
}

/** Nota média e números do jogador em cada setor em que jogou. */
export function PositionSplits({ splits }: { splits: PositionSplit[] }) {
  const best = bestPosition(splits);

  return (
    <div className="space-y-3">
      {best && <p className="font-semibold">{verdict(splits, best)}</p>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 sm:gap-3">
        {splits.map((split) => {
          const isBest = split.position === best;
          return (
            <div
              key={split.position}
              className={cn("flex flex-col gap-1 border bg-card p-4", isBest && "border-primary")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="kicker text-muted-foreground">{formatPositionGroup(split.position)}</span>
                {isBest && <span className="kicker text-primary">Melhor</span>}
              </div>
              <span className={cn("figure text-4xl", isBest && "text-primary")}>
                {formatRating(split.averageRating)}
              </span>
              <span className="text-xs text-muted-foreground">
                {plural(split.games, "jogo", "jogos")} · {split.goals}G {split.assists}A ·{" "}
                {formatPercent(split.winRate)} de vitórias
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
