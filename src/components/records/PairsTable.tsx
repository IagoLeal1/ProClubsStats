import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import type { PlayerPair } from "@/lib/stats/partnerships";

interface PairsTableProps {
  clubId: string;
  pairs: PlayerPair[];
}

/** Duplas: desempenho do clube com os dois jogadores em campo. */
export function PairsTable({ clubId, pairs }: PairsTableProps) {
  const profile = (id: string) => `/clubs/${clubId}/players/${id}`;

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Dupla</TableHead>
            <TableHead className="text-right">Jogos</TableHead>
            <TableHead className="text-right">V-E-D</TableHead>
            <TableHead className="text-right">% vitórias</TableHead>
            <TableHead className="text-right" title="Gols + assistências dos dois juntos">
              G+A
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <TableRow key={`${pair.first.id}|${pair.second.id}`}>
              <TableCell className="pl-4 font-medium">
                <Link href={profile(pair.first.id)} className="hover:underline">
                  {pair.first.name}
                </Link>
                <span className="text-muted-foreground"> + </span>
                <Link href={profile(pair.second.id)} className="hover:underline">
                  {pair.second.name}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular">{pair.games}</TableCell>
              <TableCell className="text-right tabular">
                {pair.wins}-{pair.draws}-{pair.losses}
              </TableCell>
              <TableCell className="text-right font-semibold tabular">{formatPercent(pair.winRate)}</TableCell>
              <TableCell className="text-right tabular">{pair.goalContributions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
