import { formatInteger, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TeamMatchStats } from "@/types/match";

interface StatRow {
  label: string;
  club: number | null;
  opponent: number | null;
  format?: (value: number | null) => string;
}

const passAccuracy = (stats: TeamMatchStats) =>
  stats.passes > 0 ? (stats.passesCompleted / stats.passes) * 100 : null;

function buildRows(club: TeamMatchStats, opponent: TeamMatchStats): StatRow[] {
  return [
    { label: "Chutes", club: club.shots, opponent: opponent.shots },
    { label: "Passes", club: club.passes, opponent: opponent.passes },
    { label: "Passes certos", club: club.passesCompleted, opponent: opponent.passesCompleted },
    {
      label: "Precisão de passe",
      club: passAccuracy(club),
      opponent: passAccuracy(opponent),
      format: (value) => formatPercent(value),
    },
    { label: "Desarmes", club: club.tackles, opponent: opponent.tackles },
    { label: "Tentativas de desarme", club: club.tackleAttempts, opponent: opponent.tackleAttempts },
    { label: "Defesas", club: club.saves, opponent: opponent.saves },
    { label: "Cartões vermelhos", club: club.redCards, opponent: opponent.redCards },
  ];
}

function ComparisonBar({ club, opponent }: { club: number; opponent: number }) {
  const total = club + opponent;
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  return (
    <div className="flex h-1.5 gap-1" aria-hidden>
      <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-muted">
        <div className="rounded-full bg-primary" style={{ width: `${share(club)}%` }} />
      </div>
      <div className="flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-draw" style={{ width: `${share(opponent)}%` }} />
      </div>
    </div>
  );
}

/** Comparação lado a lado das estatísticas das duas equipes. */
export function MatchTeamStats({ club, opponent }: { club: TeamMatchStats; opponent: TeamMatchStats }) {
  return (
    <div className="space-y-4 border bg-card p-4 sm:p-6">
      {buildRows(club, opponent).map((row) => {
        const format = row.format ?? formatInteger;
        const clubValue = row.club ?? 0;
        const opponentValue = row.opponent ?? 0;
        return (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className={cn("figure text-2xl", clubValue > opponentValue && "text-primary")}>
                {format(row.club)}
              </span>
              <span className="kicker text-center text-muted-foreground">{row.label}</span>
              <span className={cn("figure text-2xl", opponentValue <= clubValue && "text-muted-foreground")}>
                {format(row.opponent)}
              </span>
            </div>
            <ComparisonBar club={clubValue} opponent={opponentValue} />
          </div>
        );
      })}
    </div>
  );
}
