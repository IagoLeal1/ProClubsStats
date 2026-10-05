import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInteger, formatPercent } from "@/lib/format";
import { gamesInRecord } from "@/lib/stats/club-metrics";
import { cn } from "@/lib/utils";
import type { ClubRecord as ClubRecordData } from "@/types/club";

const SEGMENTS = [
  { key: "wins", label: "Vitórias", className: "bg-win" },
  { key: "draws", label: "Empates", className: "bg-draw" },
  { key: "losses", label: "Derrotas", className: "bg-loss" },
] as const;

/** Distribuição de vitórias, empates e derrotas. */
export function ClubRecord({ record }: { record: ClubRecordData }) {
  const games = gamesInRecord(record);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campanha</CardTitle>
        <CardDescription>Partidas de liga registradas pela EA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`${record.wins} vitórias, ${record.draws} empates e ${record.losses} derrotas`}
        >
          {games > 0 &&
            SEGMENTS.map((segment) => (
              <div
                key={segment.key}
                className={cn("h-full", segment.className)}
                style={{ width: `${(record[segment.key] / games) * 100}%` }}
              />
            ))}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {SEGMENTS.map((segment) => (
            <div key={segment.key} className="rounded-lg bg-muted/50 px-2 py-2.5">
              <dt className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", segment.className)} aria-hidden />
                {segment.label}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular">
                {formatInteger(record[segment.key])}
              </dd>
              <dd className="text-xs text-muted-foreground tabular">
                {formatPercent(games > 0 ? (record[segment.key] / games) * 100 : null)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
