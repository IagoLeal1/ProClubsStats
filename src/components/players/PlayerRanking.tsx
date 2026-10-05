import Link from "next/link";

import { formatInteger, formatPercent, formatRating } from "@/lib/format";
import type { RankingCategory, RankingFormat } from "@/lib/stats/player-stats";

const profileHref = (entry: RankingCategory["entries"][number]) =>
  `/clubs/${entry.player.clubId}/players/${entry.player.id}`;

function formatValue(value: number, format: RankingFormat): string {
  if (format === "rating") return formatRating(value);
  if (format === "percent") return formatPercent(value);
  return formatInteger(value);
}

function RankingCard({ category }: { category: RankingCategory }) {
  const [leader, ...others] = category.entries;

  return (
    <article className="flex flex-col gap-3.5 border bg-card p-5">
      <span className="kicker text-muted-foreground">{category.title}</span>
      {leader ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <Link href={profileHref(leader)} className="min-w-0 text-xl leading-tight font-bold break-words hover:text-primary">
              {leader.player.name}
            </Link>
            <span className="figure text-[3.25rem] text-primary">{formatValue(leader.value, category.format)}</span>
          </div>
          {others.length > 0 && (
            <ol className="space-y-1.5 border-t pt-3 text-sm text-muted-foreground" start={2}>
              {others.map((entry, index) => (
                <li key={entry.player.id} className="flex justify-between gap-3">
                  <Link href={profileHref(entry)} className="truncate hover:text-foreground">
                    {index + 2}. {entry.player.name}
                  </Link>
                  <span className="tabular">{formatValue(entry.value, category.format)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
      )}
    </article>
  );
}

export function PlayerRanking({ categories }: { categories: RankingCategory[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
      {categories.map((category) => (
        <RankingCard key={category.id} category={category} />
      ))}
    </div>
  );
}
