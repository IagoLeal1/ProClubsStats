import Link from "next/link";
import { ZapIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DecisivePlayer } from "@/lib/stats/decisive";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const perGameFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Ex.: "garantiu 3 vitórias e salvou 1 empate". */
export function decisiveOutcome(player: DecisivePlayer): string {
  const parts = [
    player.winsSecured > 0 && `garantiu ${plural(player.winsSecured, "vitória", "vitórias")}`,
    player.drawsSaved > 0 && `salvou ${plural(player.drawsSaved, "empate", "empates")}`,
  ].filter((part): part is string => Boolean(part));
  return parts.join(" e ");
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Destaque da visão geral: o mais decisivo do histórico e quem vem atrás. */
export function DecisiveSpotlight({ clubId, players }: { clubId: string; players: DecisivePlayer[] }) {
  const [leader, ...rest] = players.filter((player) => player.points > 0);
  if (!leader) return null;
  const runnersUp = rest.slice(0, 4);

  return (
    <section aria-label="O cara decisivo" className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <Link
        href={`/clubs/${clubId}/players/${leader.playerId}`}
        className="relative flex flex-col gap-2 overflow-hidden bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95 sm:p-8"
      >
        <ZapIcon
          aria-hidden
          className="pointer-events-none absolute -top-6 -right-6 size-44 stroke-[1] opacity-20 sm:size-56"
        />
        <span className="kicker">O cara decisivo</span>
        <span className="figure text-5xl break-all uppercase sm:text-7xl">{leader.playerName}</span>
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="figure text-4xl tabular">{leader.points}</span>
          <span className="font-semibold">pontos que o time não teria sem os gols e as assistências dele</span>
        </p>
        <span className="text-sm font-medium">
          {capitalize(decisiveOutcome(leader))} em {plural(leader.games, "jogo", "jogos")} ·{" "}
          {leader.goals}G {leader.assists}A que mudaram o resultado
        </span>
      </Link>

      {runnersUp.length > 0 && (
        <div className="flex flex-col gap-3.5 border bg-card p-5">
          <span className="kicker text-muted-foreground">Quem mais decide</span>
          <ol className="space-y-2.5">
            {runnersUp.map((player, index) => (
              <li key={player.playerId} className="flex items-center gap-3">
                <span className="figure w-5 text-xl text-muted-foreground">{index + 2}</span>
                <Link
                  href={`/clubs/${clubId}/players/${player.playerId}`}
                  className="min-w-0 flex-1 truncate font-semibold hover:text-primary"
                >
                  {player.playerName}
                </Link>
                <span className="shrink-0 text-sm text-muted-foreground">
                  <span className="figure text-2xl text-foreground tabular">{player.points}</span> pts
                </span>
              </li>
            ))}
          </ol>
          <Link
            href={`/clubs/${clubId}/records#decisivos`}
            className="mt-auto text-sm text-muted-foreground hover:text-foreground"
          >
            Nas partidas salvas · como a conta funciona
          </Link>
        </div>
      )}
    </section>
  );
}

/** Ranking completo de Recordes: só quem já mudou algum resultado. */
export function DecisiveTable({ clubId, players }: { clubId: string; players: DecisivePlayer[] }) {
  const ranked = players.filter((player) => player.points > 0);
  if (ranked.length === 0) {
    return <p className="text-sm text-muted-foreground">Ninguém mudou um resultado com gol ou assistência ainda.</p>;
  }

  return (
    <div className="overflow-hidden border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Jogador</TableHead>
            <TableHead className="text-right" title="Pontos que o time não teria sem os gols e as assistências dele">
              Pontos
            </TableHead>
            <TableHead className="text-right max-sm:hidden" title="Pontos decisivos por jogo">
              Por jogo
            </TableHead>
            <TableHead className="text-right" title="Vitórias que, sem ele, seriam empate ou derrota">
              V
            </TableHead>
            <TableHead className="pr-4 text-right" title="Empates que, sem ele, seriam derrota">
              E
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranked.map((player, index) => (
            <TableRow key={player.playerId}>
              <TableCell className="pl-4">
                <Link
                  href={`/clubs/${clubId}/players/${player.playerId}`}
                  className="block font-semibold hover:text-primary"
                >
                  {player.playerName}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {player.goals}G {player.assists}A decisivos · {plural(player.games, "jogo", "jogos")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={index === 0 ? "figure text-2xl text-primary tabular" : "figure text-2xl tabular"}>
                  {player.points}
                </span>
              </TableCell>
              <TableCell className="text-right tabular max-sm:hidden">
                {perGameFormat.format(player.points / player.games)}
              </TableCell>
              <TableCell
                className="text-right tabular"
                title={
                  player.lossesTurned > 0
                    ? `${plural(player.lossesTurned, "seria derrota", "seriam derrota")} sem ele`
                    : undefined
                }
              >
                {player.winsSecured}
              </TableCell>
              <TableCell className="pr-4 text-right tabular">{player.drawsSaved}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
