import { StarIcon } from "lucide-react";

import { RatingBadge } from "@/components/players/RatingBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInteger, formatPositionGroupShort, formatSecondsAsMinutes } from "@/lib/format";
import type { MatchPlayerStats as MatchPlayerStatsData } from "@/types/match";

interface Column {
  label: string;
  title: string;
  render: (player: MatchPlayerStatsData) => React.ReactNode;
}

const COLUMNS: Column[] = [
  { label: "Pos", title: "Posição", render: (p) => formatPositionGroupShort(p.position) },
  { label: "Nota", title: "Nota", render: (p) => <RatingBadge rating={p.rating} /> },
  { label: "G", title: "Gols", render: (p) => formatInteger(p.goals) },
  { label: "A", title: "Assistências", render: (p) => formatInteger(p.assists) },
  { label: "Chutes", title: "Chutes", render: (p) => formatInteger(p.shots) },
  {
    label: "Passes",
    title: "Passes certos / tentados",
    render: (p) => `${formatInteger(p.passesCompleted)}/${formatInteger(p.passes)}`,
  },
  {
    label: "Desarmes",
    title: "Desarmes certos / tentados",
    render: (p) => `${formatInteger(p.tackles)}/${formatInteger(p.tackleAttempts)}`,
  },
  { label: "Def", title: "Defesas", render: (p) => formatInteger(p.saves) },
  { label: "CV", title: "Cartões vermelhos", render: (p) => formatInteger(p.redCards) },
  { label: "Min", title: "Minutos jogados", render: (p) => formatSecondsAsMinutes(p.secondsPlayed) },
];

/** Estatísticas individuais dos jogadores do clube na partida. */
export function MatchPlayerStats({ players }: { players: MatchPlayerStatsData[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 min-w-40 bg-card pl-4">Jogador</TableHead>
            {COLUMNS.map((column) => (
              <TableHead key={column.label} title={column.title} className="text-right">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.playerId} className="group">
              <TableCell className="sticky left-0 z-10 bg-card pl-4 group-hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_50%)]">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{player.playerName}</span>
                  {player.manOfTheMatch && (
                    <StarIcon
                      className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
                      aria-label="Craque da partida"
                    />
                  )}
                </div>
                {player.proName && (
                  <p className="truncate text-xs text-muted-foreground">{player.proName}</p>
                )}
              </TableCell>
              {COLUMNS.map((column) => (
                <TableCell key={column.label} className="text-right tabular">
                  {column.render(player)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
