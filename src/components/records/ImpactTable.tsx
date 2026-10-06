import Link from "next/link";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import { MIN_IMPACT_GAMES, type PlayerImpact } from "@/lib/stats/impact";
import type { RecordSlice } from "@/lib/stats/sessions";
import { cn } from "@/lib/utils";

/** Ex.: "+14 pts", "−5 pts" (ou só "+14" sem a unidade). */
export function formatPointsDelta(delta: number, unit = true): string {
  const rounded = Math.round(delta);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return `${sign}${Math.abs(rounded)}${unit ? " pts" : ""}`;
}

function SliceCell({ slice }: { slice: RecordSlice | null }) {
  if (!slice) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold">{formatPercent(slice.pointsRate)}</span>{" "}
      <span className="text-xs text-muted-foreground">{slice.games}j</span>
    </span>
  );
}

/** Seta + diferença de aproveitamento, com cor e rótulo (nunca só a cor). */
export function ImpactDelta({ delta, unit = true, className }: { delta: number; unit?: boolean; className?: string }) {
  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-display text-base font-bold whitespace-nowrap tabular",
        positive ? "text-win" : "text-loss",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {formatPointsDelta(delta, unit)}
    </span>
  );
}

/** Aproveitamento do time com e sem cada jogador em campo. */
export function ImpactTable({ clubId, impacts }: { clubId: string; impacts: PlayerImpact[] }) {
  return (
    <div className="overflow-hidden border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Jogador</TableHead>
            <TableHead className="text-right" title="Aproveitamento com ele em campo">
              Com
            </TableHead>
            <TableHead className="text-right" title="Aproveitamento sem ele">
              Sem
            </TableHead>
            <TableHead className="pr-4 text-right" title="Diferença em pontos percentuais">
              Dif.
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {impacts.map((impact) => (
            <TableRow key={impact.playerId}>
              <TableCell className="pl-4 font-semibold">
                <Link href={`/clubs/${clubId}/players/${impact.playerId}`} className="hover:text-primary">
                  {impact.playerName}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular">
                <SliceCell slice={impact.withPlayer} />
              </TableCell>
              <TableCell className="text-right tabular">
                <SliceCell slice={impact.withoutPlayer} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                {impact.delta === null ? (
                  <span className="text-muted-foreground" title={`Precisa de ${MIN_IMPACT_GAMES}+ jogos com e sem ele`}>
                    —<span className="sr-only">: poucos jogos para comparar</span>
                  </span>
                ) : (
                  <ImpactDelta delta={impact.delta} unit={false} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
