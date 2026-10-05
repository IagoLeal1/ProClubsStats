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
    <div className="overflow-hidden border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Dupla</TableHead>
            <TableHead className="text-right" title="Jogos juntos">J</TableHead>
            <TableHead className="text-right">V-E-D</TableHead>
            <TableHead className="text-right" title="Porcentagem de vitórias">% Vit.</TableHead>
            <TableHead className="text-right max-sm:hidden" title="Gols + assistências dos dois juntos">
              G+A
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair) => (
            <TableRow key={`${pair.first.id}|${pair.second.id}`}>
              <TableCell className="pl-4 font-medium">
                <Link href={profile(pair.first.id)} className="hover:text-primary">
                  {pair.first.name}
                </Link>
                <span className="text-muted-foreground"> + </span>
                <Link href={profile(pair.second.id)} className="hover:text-primary">
                  {pair.second.name}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular">{pair.games}</TableCell>
              <TableCell className="text-right tabular">
                {pair.wins}-{pair.draws}-{pair.losses}
              </TableCell>
              <TableCell className="text-right"><span className="figure text-xl text-primary">{formatPercent(pair.winRate)}</span></TableCell>
              <TableCell className="text-right tabular max-sm:hidden">{pair.goalContributions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
