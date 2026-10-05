import Link from "next/link";
import {
  ActivityIcon,
  CrosshairIcon,
  FootprintsIcon,
  type LucideIcon,
  MedalIcon,
  RouteIcon,
  StarIcon,
  TrophyIcon,
} from "lucide-react";

import { formatInteger, formatPercent, formatRating } from "@/lib/format";
import type { RankingCategory, RankingFormat } from "@/lib/stats/player-stats";

const ICONS: Record<string, LucideIcon> = {
  goals: CrosshairIcon,
  assists: FootprintsIcon,
  goalsAndAssists: TrophyIcon,
  rating: StarIcon,
  games: ActivityIcon,
  passing: RouteIcon,
  mvp: MedalIcon,
};

const profileHref = (entry: RankingCategory["entries"][number]) =>
  `/clubs/${entry.player.clubId}/players/${entry.player.id}`;

function formatValue(value: number, format: RankingFormat): string {
  if (format === "rating") return formatRating(value);
  if (format === "percent") return formatPercent(value);
  return formatInteger(value);
}

function RankingCard({ category }: { category: RankingCategory }) {
  const Icon = ICONS[category.id] ?? TrophyIcon;
  const [leader, ...others] = category.entries;

  return (
    <div className="flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {category.title}
      </p>

      {leader ? (
        <>
          <div className="mt-2 flex items-end justify-between gap-3">
            <Link href={profileHref(leader)} className="min-w-0 truncate font-semibold hover:underline">
              {leader.player.name}
            </Link>
            <p className="text-2xl font-semibold text-primary tabular">
              {formatValue(leader.value, category.format)}
            </p>
          </div>
          {others.length > 0 && (
            <ol className="mt-3 space-y-1 border-t pt-3 text-sm" start={2}>
              {others.map((entry, index) => (
                <li key={entry.player.id} className="flex justify-between gap-3 text-muted-foreground">
                  <Link href={profileHref(entry)} className="truncate hover:text-foreground hover:underline">
                    {index + 2}. {entry.player.name}
                  </Link>
                  <span className="tabular">{formatValue(entry.value, category.format)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Sem dados suficientes.</p>
      )}
    </div>
  );
}

export function PlayerRanking({ categories }: { categories: RankingCategory[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map((category) => (
        <RankingCard key={category.id} category={category} />
      ))}
    </div>
  );
}
