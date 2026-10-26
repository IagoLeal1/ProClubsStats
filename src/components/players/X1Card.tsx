import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { X1Line } from "@/lib/stats/x1";
import { cn } from "@/lib/utils";

/** Os três primeiros do Rei do x1, com atalho para a tabela. */
export function X1Card({ clubId, lines }: { clubId: string; lines: X1Line[] }) {
  if (lines.length === 0) return null;
  return (
    <section className="flex flex-col gap-4 border bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <span className="kicker text-primary">Rei do x1</span>
        <p className="text-sm text-muted-foreground">
          Todos contra todos nos jogos em que estavam juntos: 3 pontos por duelo vencido.
        </p>
      </div>
      <ol className="space-y-2.5">
        {lines.slice(0, 3).map((line, index) => (
          <li key={line.playerId} className="flex items-center gap-3">
            <span className={cn("figure w-5 text-2xl", index === 0 ? "text-primary" : "text-muted-foreground")}>
              {index + 1}
            </span>
            <Link
              href={`/clubs/${clubId}/players/${line.playerId}`}
              className={cn("min-w-0 flex-1 truncate font-semibold hover:text-primary", index === 0 && "text-primary")}
            >
              {line.playerName}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground tabular">
              {line.wins}V {line.draws}E {line.losses}D
            </span>
            <span className="w-14 shrink-0 text-right text-sm text-muted-foreground">
              <span className="figure text-2xl text-foreground tabular">{line.points}</span> pts
            </span>
          </li>
        ))}
      </ol>
      <Link
        href={`/clubs/${clubId}/players/x1`}
        className="inline-flex items-center gap-1.5 font-display text-sm font-bold tracking-[0.08em] text-muted-foreground uppercase hover:text-foreground"
      >
        Tabela e todos os duelos <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
