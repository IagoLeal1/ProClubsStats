import { formatDecimal, formatInteger, formatPercent, formatSigned } from "@/lib/format";
import { computeClubMetrics, gamesInRecord } from "@/lib/stats/club-metrics";
import { cn } from "@/lib/utils";
import type { ClubRecord } from "@/types/club";

type Tone = "default" | "win" | "draw" | "loss" | "primary";

const TONE_CLASSES: Record<Tone, string> = {
  default: "text-foreground",
  win: "text-win",
  draw: "text-draw",
  loss: "text-loss",
  primary: "text-primary",
};

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}

function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tracking-tight tabular sm:text-3xl", TONE_CLASSES[tone])}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground tabular">{hint}</p>}
    </div>
  );
}

export function ClubStats({ record }: { record: ClubRecord }) {
  const metrics = computeClubMetrics(record);
  const goalDifferenceTone: Tone =
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
