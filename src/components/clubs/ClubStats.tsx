import { StatCard, type StatTone } from "@/components/stats/StatCard";
import { formatDecimal, formatInteger, formatPercent, formatSigned } from "@/lib/format";
import { computeClubMetrics, gamesInRecord } from "@/lib/stats/club-metrics";
import type { ClubRecord } from "@/types/club";

export function ClubStats({ record }: { record: ClubRecord }) {
  const metrics = computeClubMetrics(record);
  const goalDifferenceTone: StatTone =
    metrics.goalDifference > 0 ? "win" : metrics.goalDifference < 0 ? "loss" : "default";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Partidas" value={formatInteger(gamesInRecord(record))} />
      <StatCard label="Vitórias" value={formatInteger(record.wins)} tone="win" />
      <StatCard label="Empates" value={formatInteger(record.draws)} tone="draw" />
      <StatCard label="Derrotas" value={formatInteger(record.losses)} tone="loss" />
      <StatCard
        label="Aproveitamento"
        value={formatPercent(metrics.pointsRate)}
        hint={`${formatPercent(metrics.winRate)} de vitórias`}
        tone="primary"
      />
      <StatCard
        label="Gols feitos"
        value={formatInteger(record.goalsFor)}
        hint={`${formatDecimal(metrics.goalsPerGame)} por jogo`}
      />
      <StatCard
        label="Gols sofridos"
        value={formatInteger(record.goalsAgainst)}
        hint={`${formatDecimal(metrics.goalsAgainstPerGame)} por jogo`}
      />
      <StatCard
        label="Saldo de gols"
        value={formatSigned(metrics.goalDifference)}
        tone={goalDifferenceTone}
      />
    </div>
  );
}
