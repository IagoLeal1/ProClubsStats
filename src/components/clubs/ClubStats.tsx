import { formatDecimal, formatInteger, formatPercent, formatSigned } from "@/lib/format";
import { computeClubMetrics, gamesInRecord } from "@/lib/stats/club-metrics";
import { cn } from "@/lib/utils";
import type { ClubRecord } from "@/types/club";

interface Cell {
  label: string;
  value: string;
  className?: string;
}

/** Faixa de placar da campanha (estilo letreiro de TV) + barra V/E/D. */
export function ClubStats({ record }: { record: ClubRecord }) {
  const metrics = computeClubMetrics(record);
  const games = gamesInRecord(record);

  const cells: Cell[] = [
    { label: "Partidas", value: formatInteger(games) },
    { label: "Vitórias", value: formatInteger(record.wins), className: "text-win" },
    { label: "Empates", value: formatInteger(record.draws), className: "text-draw" },
    { label: "Derrotas", value: formatInteger(record.losses), className: "text-loss" },
    { label: "Aproveitamento", value: formatPercent(metrics.pointsRate), className: "text-primary" },
    { label: "Gols feitos", value: formatInteger(record.goalsFor) },
    { label: "Gols sofridos", value: formatInteger(record.goalsAgainst) },
    {
      label: "Saldo",
      value: formatSigned(metrics.goalDifference),
      className: metrics.goalDifference > 0 ? "text-win" : metrics.goalDifference < 0 ? "text-loss" : undefined,
    },
  ];

  return (
    <div className="space-y-2.5">
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] border bg-card">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-1 border-r border-b px-5 py-4">
            <dt className="kicker text-muted-foreground">{cell.label}</dt>
            <dd className={cn("figure text-[2.75rem]", cell.className)}>{cell.value}</dd>
          </div>
        ))}
      </dl>
      {games > 0 && (
        <div className="flex h-1.5 gap-[3px]" role="img" aria-label={`${record.wins} vitórias, ${record.draws} empates, ${record.losses} derrotas`}>
          <div className="bg-win" style={{ flex: record.wins }} />
          <div className="bg-draw" style={{ flex: record.draws }} />
          <div className="bg-loss" style={{ flex: record.losses }} />
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Partidas de liga registradas pela EA · {formatDecimal(metrics.goalsPerGame)} gols feitos e{" "}
        {formatDecimal(metrics.goalsAgainstPerGame)} sofridos por jogo
      </p>
    </div>
  );
}
