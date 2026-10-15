import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import type { DivisionStep } from "@/lib/stats/progress";
import { cn } from "@/lib/utils";
import type { ClubDivision } from "@/types/club";

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

/** Ex.: "4ª" (divisão é feminino). */
export const divisionLabel = (division: number | null) => (division === null ? "—" : `${division}ª`);

interface DivisionCardProps {
  division: ClubDivision;
  /** Trajetória registrada pelo site (pode ter um só trecho). */
  timeline: DivisionStep[];
}

/** Divisão atual no ranking da EA, a melhor já alcançada e o sobe-e-desce registrado. */
export function DivisionCard({ division, timeline }: DivisionCardProps) {
  // Mudanças da mais recente para a mais antiga; divisão menor = subiu.
  const changes = timeline
    .slice(1)
    .map((step, index) => ({ from: timeline[index].division, to: step.division, at: step.since }))
    .reverse()
    .slice(0, 4);
  const stats = [
    { label: "Melhor", value: divisionLabel(division.best), tone: "" },
    { label: "Acessos", value: division.promotions ?? "—", tone: "text-win" },
    { label: "Quedas", value: division.relegations ?? "—", tone: "text-loss" },
  ];

  return (
    <section className="flex flex-col gap-4 border bg-card p-5 sm:p-6">
      <span className="kicker text-primary">Divisão</span>
      <div className="flex items-baseline gap-3">
        <span className="figure text-6xl">{divisionLabel(division.current)}</span>
        <span className="font-display text-lg font-bold tracking-[0.06em] text-muted-foreground uppercase">
          divisão
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 bg-surface/60 p-3">
            <dt className="kicker text-[11px] text-muted-foreground">{stat.label}</dt>
            <dd className={cn("figure text-3xl", stat.tone)}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {changes.length > 0 ? (
        <ul className="space-y-2" aria-label="Últimas subidas e quedas">
          {changes.map((change) => {
            const up = change.to < change.from;
            const Icon = up ? ArrowUpIcon : ArrowDownIcon;
            return (
              <li key={change.at} className="flex items-center justify-between gap-3 text-sm">
                <span className={cn("flex items-center gap-1.5 font-semibold", up ? "text-win" : "text-loss")}>
                  <Icon className="size-4" aria-hidden />
                  {up ? "Subiu" : "Caiu"} para a {divisionLabel(change.to)}
                </span>
                <span className="text-muted-foreground tabular">{shortDate.format(new Date(change.at))}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {timeline[0]
            ? `O site registra a divisão a cada jogo de liga desde ${shortDate.format(new Date(timeline[0].since))}: as próximas subidas e quedas aparecem aqui.`
            : "O site passa a registrar a divisão no próximo jogo de liga: as subidas e quedas aparecem aqui."}
        </p>
      )}
    </section>
  );
}
