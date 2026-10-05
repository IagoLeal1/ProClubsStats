import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerSortKey, SortDirection } from "@/lib/stats/player-stats";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/player";

import { PLAYER_STAT_COLUMNS } from "./player-columns";

/** Texto ordena crescente por padrão; números, decrescente. */
export function defaultDirection(key: PlayerSortKey): SortDirection {
  return key === "name" || key === "position" ? "asc" : "desc";
}

export function sortHref(
  basePath: string,
  key: PlayerSortKey,
  current: PlayerSortKey,
  direction: SortDirection,
): string {
  const nextDirection =
    key === current ? (direction === "asc" ? "desc" : "asc") : defaultDirection(key);
  return `${basePath}?sort=${key}&dir=${nextDirection}`;
}

interface SortableHeadProps {
  label: string;
  title?: string;
  columnKey: PlayerSortKey;
  basePath: string;
  sort: PlayerSortKey;
  direction: SortDirection;
  className?: string;
}

function SortableHead({ label, title, columnKey, basePath, sort, direction, className }: SortableHeadProps) {
  const active = sort === columnKey;
  const Arrow = direction === "asc" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : undefined}
    >
      <Link
        href={sortHref(basePath, columnKey, sort, direction)}
        title={title}
        scroll={false}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {active && <Arrow className="size-3" aria-hidden />}
      </Link>
    </TableHead>
  );
}

interface PlayerTableProps {
  players: Player[];
  basePath: string;
  sort: PlayerSortKey;
  direction: SortDirection;
}

export function PlayerTable({ players, basePath, sort, direction }: PlayerTableProps) {
  const headProps = { basePath, sort, direction };

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead
              label="Jogador"
              columnKey="name"
              className="sticky left-0 z-10 min-w-44 bg-card pl-4"
              {...headProps}
            />
            {PLAYER_STAT_COLUMNS.map((column) => (
              <SortableHead
                key={column.key}
                label={column.shortLabel}
                title={column.label}
                columnKey={column.key}
                className="text-right"
                {...headProps}
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id} className="group">
              <TableCell className="sticky left-0 z-10 bg-card pl-4 group-hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_50%)]">
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{player.name}</p>
                    {player.proName && (
                      <p className="truncate text-xs text-muted-foreground">{player.proName}</p>
                    )}
                  </div>
                  {!player.isMember && (
                    <Badge variant="outline" className="text-[10px]">
                      ex-membro
                    </Badge>
                  )}
                </div>
              </TableCell>
              {PLAYER_STAT_COLUMNS.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn("text-right tabular", sort === column.key && "font-semibold")}
                >
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
