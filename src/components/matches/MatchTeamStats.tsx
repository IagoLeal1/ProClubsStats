import { formatInteger, formatPercent } from "@/lib/format";
import { rate } from "@/lib/stats/sessions";
import { cn } from "@/lib/utils";
import type { TeamMatchStats } from "@/types/match";

interface StatRow {
  label: string;
  club: number | null;
  opponent: number | null;
  format?: (value: number | null) => string;
}

const passAccuracy = (stats: TeamMatchStats) => rate(stats.passesCompleted, stats.passes);
/** Gols do placar sobre finalizações (a EA só conta as finalizações dos jogadores humanos). */
const conversion = (stats: TeamMatchStats) => rate(stats.goals, stats.shots);

function buildRows(club: TeamMatchStats, opponent: TeamMatchStats): StatRow[] {
  return [
    { label: "Gols", club: club.goals, opponent: opponent.goals },
    { label: "Finalizações", club: club.shots, opponent: opponent.shots },
    {
      label: "Conversão",
      club: conversion(club),
      opponent: conversion(opponent),
      format: (value) => formatPercent(value),
    },
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

interface MatchTeamStatsProps {
  club: TeamMatchStats;
  opponent: TeamMatchStats;
  /** Nomes no topo das colunas (ex.: na soma de uma noite). */
  labels?: { club: string; opponent: string };
}

/** Comparação lado a lado das estatísticas das duas equipes. */
export function MatchTeamStats({ club, opponent, labels }: MatchTeamStatsProps) {
  return (
    <div className="space-y-4 border bg-card p-4 sm:p-6">
      {labels && (
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <span className="kicker text-primary">{labels.club}</span>
          <span className="kicker text-muted-foreground">{labels.opponent}</span>
        </div>
      )}
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
