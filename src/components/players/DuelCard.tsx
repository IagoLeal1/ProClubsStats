import Link from "next/link";

import { formatPositionGroupShort } from "@/lib/format";
import { formatDuelValue, type Duel, type DuelRow } from "@/lib/stats/versus";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/player";


type Side = "a" | "b" | null;

function winnerOf(row: DuelRow): Side {
  if (row.a === null || row.b === null || row.a === row.b) return null;
  const aAhead = row.lowerIsBetter ? row.a < row.b : row.a > row.b;
  return aAhead ? "a" : "b";
}

function DuelBar({ row, winner }: { row: DuelRow; winner: Side }) {
  const a = row.a ?? 0;
  const b = row.b ?? 0;
  const total = a + b;
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);
  const fill = (side: "a" | "b") => (winner === side ? "bg-primary" : "bg-muted-foreground/40");
  return (
    <div className="flex h-1.5 gap-1" aria-hidden>
      <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-muted">
        <div className={cn("rounded-full", fill("a"))} style={{ width: `${share(a)}%` }} />
      </div>
      <div className="flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", fill("b"))} style={{ width: `${share(b)}%` }} />
      </div>
    </div>
  );
}

function Corner({ player, align, leading }: { player: Player; align: "left" | "right"; leading: boolean }) {
  const position = player.position ?? formatPositionGroupShort(player.favoritePosition);
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", align === "right" && "items-end text-right")}>
      <Link
        href={`/clubs/${player.clubId}/players/${player.id}`}
        className={cn(
          "figure text-3xl break-all uppercase transition-colors hover:text-primary sm:text-6xl",
          leading && "text-primary",
        )}
      >
        {player.name}
      </Link>
      <span className="font-display text-sm font-bold tracking-[0.06em] text-muted-foreground uppercase">
        {position}
        {player.overall !== null && ` · ${player.overall} OVR`}
      </span>
    </div>
  );
}

interface DuelCardProps {
  a: Player;
  b: Player;
  duel: Duel;
  /** Links das abas; `juntos` é null quando os dois nunca jogaram juntos. */
  scopeHrefs: { juntos: string | null; total: string; geral: string };
}

/** O card do duelo: placar de estatísticas vencidas e as sete linhas lado a lado. */
export function DuelCard({ a, b, duel, scopeHrefs }: DuelCardProps) {
  const { score } = duel;
  const leader: Side = score.a > score.b ? "a" : score.b > score.a ? "b" : null;
  const games = `${duel.games.a} jogos de ${a.name}, ${duel.games.b} de ${b.name}`;
  const caption = {
    juntos: `Nos ${duel.games.a} jogos em que os dois estavam em campo`,
    total: `Somando todas as partidas salvas: ${games}. Quem jogou mais leva vantagem.`,
    geral: `Média por jogo: ${games}`,
  }[duel.scope];
  const hints = [...new Set(duel.rows.flatMap((row) => (row.hint ? [`${row.label.toLowerCase()} ${row.hint}`] : [])))];

  return (
    <section className="overflow-hidden border bg-card">
      <div className="space-y-6 px-5 pt-6 pb-6 sm:px-8 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="kicker text-primary">Duelo</span>
          <nav aria-label="Como comparar" className="flex flex-wrap gap-1.5">
            {scopeHrefs.juntos ? (
              <ScopeLink href={scopeHrefs.juntos} active={duel.scope === "juntos"}>
                Jogando juntos
              </ScopeLink>
            ) : (
              <span className="flex h-8 items-center rounded-full border border-dashed px-3 text-xs text-muted-foreground">
                Nunca jogaram juntos
              </span>
            )}
            <ScopeLink href={scopeHrefs.total} active={duel.scope === "total"}>
              Todos os jogos
            </ScopeLink>
            <ScopeLink href={scopeHrefs.geral} active={duel.scope === "geral"}>
              Por jogo
            </ScopeLink>
          </nav>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-6">
          <Corner player={a} align="left" leading={leader === "a"} />
          <span className="clip-slant mt-1 bg-primary px-3 py-1 font-display text-xl font-extrabold text-primary-foreground italic sm:mt-3 sm:px-4 sm:text-2xl">
            VS
          </span>
          <Corner player={b} align="right" leading={leader === "b"} />
        </div>

        <div className="space-y-1.5 text-center">
          <p className="figure text-6xl tabular sm:text-7xl" aria-label={`${a.name} ${score.a} × ${score.b} ${b.name}`}>
            <span className={cn(leader === "a" ? "text-primary" : leader === "b" && "text-muted-foreground")}>
              {score.a}
            </span>
            <span className="px-3 text-muted-foreground">×</span>
            <span className={cn(leader === "b" ? "text-primary" : leader === "a" && "text-muted-foreground")}>
              {score.b}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">{caption}</p>
        </div>
      </div>

      <div className="space-y-4 border-t px-5 py-6 sm:px-8">
        {duel.rows.map((row) => {
          const winner = winnerOf(row);
          return (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("figure w-20 text-2xl tabular sm:text-3xl", winner === "a" && "text-primary")}>
                  {formatDuelValue(row.format, row.a)}
                </span>
                <span className="kicker text-center text-muted-foreground">
                  {row.label}
                  {row.lowerIsBetter && <span className="block text-[10px] tracking-[0.1em] normal-case">menos é melhor</span>}
                </span>
                <span
                  className={cn("figure w-20 text-right text-2xl tabular sm:text-3xl", winner === "b" && "text-primary")}
                >
                  {formatDuelValue(row.format, row.b)}
                </span>
              </div>
              <DuelBar row={row} winner={winner} />
            </div>
          );
        })}
      </div>

      <p className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-8">
        Cada estatística vencida vale 1 ponto no placar; empate não conta.
        {hints.length > 0 && ` Contadas ${hints.join(", ")}.`}
      </p>
    </section>
  );
}

function ScopeLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary",
      )}
    >
      {children}
    </Link>
  );
}
