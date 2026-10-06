import Link from "next/link";

import { RatingDelta } from "@/components/players/FormBadge";
import { RatingBadge } from "@/components/players/RatingBadge";
import { SliceStat } from "@/components/stats/SliceStat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRating } from "@/lib/format";
import { MIN_CLUTCH_GAMES, type ClutchSummary } from "@/lib/stats/clutch";

/** Campanha nos jogos decididos por 1 gol e quem cresce (ou some) neles. */
export function ClutchSection({ clubId, clutch }: { clubId: string; clutch: ClutchSummary }) {
  const { close, others, players } = clutch;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {close ? (
          <SliceStat label="Decididos por 1 gol" slice={close} className="border-primary" />
        ) : (
          <div className="border bg-card p-4 text-sm text-muted-foreground">Nenhum jogo apertado ainda.</div>
        )}
        {others && <SliceStat label="Os demais jogos" slice={others} />}
      </div>

      {players.length > 0 ? (
        <div className="overflow-hidden border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Jogador</TableHead>
                <TableHead className="text-right" title="Jogos decisivos">
                  J
                </TableHead>
                <TableHead className="text-right" title="Nota média nos jogos decisivos">
                  Nota
                </TableHead>
                <TableHead className="pr-4 text-right" title="Comparado com a nota média em todos os jogos">
                  vs geral
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => {
                const delta = Math.round((player.closeRating - player.overallRating) * 10) / 10;
                return (
                  <TableRow key={player.playerId}>
                    <TableCell className="pl-4">
                      <Link
                        href={`/clubs/${clubId}/players/${player.playerId}`}
                        className="block font-semibold hover:text-primary"
                      >
                        {player.playerName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {player.goals}G {player.assists}A nos decisivos
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular">{player.closeGames}</TableCell>
                    <TableCell className="text-right">
                      <RatingBadge rating={player.closeRating} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <RatingDelta delta={delta} title={`Nota geral: ${formatRating(player.overallRating)}`} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ainda ninguém tem {MIN_CLUTCH_GAMES} jogos decisivos salvos.
        </p>
      )}
    </div>
  );
}
