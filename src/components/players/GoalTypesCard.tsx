import Link from "next/link";

import { formatPercent } from "@/lib/format";
import { rate } from "@/lib/stats/sessions";
import { GOAL_TYPE_KEYS, GOAL_TYPE_LABELS, type TrackedEventLine } from "@/lib/stats/tracked-events";

/** Gols do clube por tipo (contadores da EA) e quem lidera cada um. */
export function GoalTypesCard({
  clubId,
  lines,
  since,
}: {
  clubId: string;
  lines: TrackedEventLine[];
  since: string;
}) {
  const goals = lines.reduce((total, line) => total + line.goals, 0);
  if (goals === 0) return null;

  return (
    <section className="flex flex-col gap-4 border bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <span className="kicker text-primary">Tipos de gol</span>
        <p className="text-sm text-muted-foreground">
          Dos {goals} gols desde {since}, pelos contadores da EA. Cobertura pode ficar abaixo do real: a EA nem sempre
          marca.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GOAL_TYPE_KEYS.map((key) => {
          const total = lines.reduce((sum, line) => sum + line.goalTypes[key], 0);
          const leader = [...lines].sort((a, b) => b.goalTypes[key] - a.goalTypes[key] || a.games - b.games)[0];
          const { label, detail } = GOAL_TYPE_LABELS[key];
          return (
            <li key={key} className="flex min-w-0 flex-col gap-1 bg-surface p-3.5">
              <span className="kicker text-muted-foreground">{label}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="figure text-4xl tabular">{total}</span>
                <span className="text-xs text-muted-foreground">{formatPercent(rate(total, goals))}</span>
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">{detail}</span>
              {leader && leader.goalTypes[key] > 0 && (
                <Link
                  href={`/clubs/${clubId}/players/${leader.playerId}`}
                  className="mt-1 truncate text-sm font-semibold text-primary hover:underline"
                >
                  {leader.playerName} · {leader.goalTypes[key]}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
