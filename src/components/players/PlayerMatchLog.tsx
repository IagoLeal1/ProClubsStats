import Link from "next/link";
import { StarIcon } from "lucide-react";

import { MatchResult } from "@/components/matches/MatchResult";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatInteger, formatPositionGroupShort } from "@/lib/format";
import type { PlayerMatchEntry } from "@/types/match";

import { RatingBadge } from "./RatingBadge";

interface Column {
  label: string;
  title: string;
  render: (entry: PlayerMatchEntry) => React.ReactNode;
}

const COLUMNS: Column[] = [
  {
    label: "Res",
    title: "Resultado",
    render: ({ match }) => (
      <span className="inline-flex items-center gap-1.5">
        <MatchResult result={match.result} size="sm" />
        {match.goalsFor}–{match.goalsAgainst}
      </span>
    ),
  },
  { label: "Pos", title: "Posição", render: ({ stats }) => formatPositionGroupShort(stats.position) },
  { label: "Nota", title: "Nota", render: ({ stats }) => <RatingBadge rating={stats.rating} /> },
  { label: "G", title: "Gols", render: ({ stats }) => formatInteger(stats.goals) },
  { label: "A", title: "Assistências", render: ({ stats }) => formatInteger(stats.assists) },
  { label: "Chutes", title: "Chutes", render: ({ stats }) => formatInteger(stats.shots) },
  {
    label: "Passes",
    title: "Passes certos / tentados",
    render: ({ stats }) => `${stats.passesCompleted}/${stats.passes}`,
  },
  {
    label: "Desarmes",
    title: "Desarmes certos / tentados",
    render: ({ stats }) => `${stats.tackles}/${stats.tackleAttempts}`,
  },
];

/** Partidas salvas do jogador — também é a versão em tabela do gráfico de notas. */
export function PlayerMatchLog({ entries }: { entries: PlayerMatchEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 min-w-44 bg-card pl-4">Partida</TableHead>
            {COLUMNS.map((column) => (
              <TableHead key={column.label} title={column.title} className="text-right">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.match.id} className="group">
              <TableCell className="sticky left-0 z-10 bg-card pl-4 group-hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_50%)]">
                <Link
                  href={`/clubs/${entry.match.clubId}/matches/${entry.match.id}`}
                  className="flex items-center gap-1.5 font-medium hover:underline"
                >
                  <span className="truncate">vs {entry.match.opponent.name}</span>
                  {entry.stats.manOfTheMatch && (
                    <StarIcon
                      className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
                      aria-label="MVP da partida"
                    />
                  )}
                </Link>
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.match.playedAt)}</p>
              </TableCell>
              {COLUMNS.map((column) => (
                <TableCell key={column.label} className="text-right tabular">
                  {column.render(entry)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
