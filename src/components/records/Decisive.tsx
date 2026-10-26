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
const pointsFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const perGameFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Ex.: "63,1". */
export const formatDecisivePoints = (points: number) => pointsFormat.format(points);

/** Ex.: "gol ou assistência em 3 vitórias e 1 empate". */
export function decisiveOutcome(player: DecisivePlayer): string {
  const games = [
    player.wins > 0 && plural(player.wins, "vitória", "vitórias"),
    player.draws > 0 && plural(player.draws, "empate", "empates"),
  ].filter((part): part is string => Boolean(part));
  return `gol ou assistência em ${games.join(" e ")}`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Explicação curta da conta, repetida onde o número aparece. */
export const DECISIVE_RULE =
  "Cada gol vale a parte dele nos pontos do jogo: no 2×1 vale 1,5, no 2×0 vale 1, no 8×1 só 0,4. Quem marca e quem dá a assistência levam o valor do gol.";

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
          <span className="figure text-4xl tabular">{formatDecisivePoints(leader.points)}</span>
          <span className="font-semibold">pontos decisivos em {plural(leader.games, "jogo", "jogos")}</span>
        </p>
        <span className="text-sm font-medium">
          {capitalize(decisiveOutcome(leader))} · {leader.goals}G {leader.assists}A que valeram pontos
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
                  <span className="figure text-2xl text-foreground tabular">{formatDecisivePoints(player.points)}</span> pts
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

/** Faixa com borda verde para o decisivo de um período (noite, mês). */
export function DecisiveStrip({ label, href, player }: { label: string; href: string; player: DecisivePlayer }) {
  return (
    <Link
      href={href}
      className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border border-primary bg-card p-5 transition-colors hover:bg-surface sm:px-8"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="kicker text-primary">{label}</span>
        <span className="figure text-4xl break-all uppercase sm:text-5xl">{player.playerName}</span>
        <span className="text-sm text-muted-foreground">
          {capitalize(decisiveOutcome(player))} · {player.goals}G {player.assists}A que valeram pontos
        </span>
      </span>
      <span className="shrink-0 text-sm text-muted-foreground">
        <span className="figure text-5xl text-primary tabular">{formatDecisivePoints(player.points)}</span> pontos
        decisivos
      </span>
    </Link>
  );
}

/** Ranking completo de Recordes: só quem já fez gol ou deu assistência que valeu ponto. */
export function DecisiveTable({ clubId, players }: { clubId: string; players: DecisivePlayer[] }) {
  const ranked = players.filter((player) => player.points > 0);
  if (ranked.length === 0) {
    return <p className="text-sm text-muted-foreground">Ninguém fez gol ou deu assistência que valeu ponto ainda.</p>;
  }

  return (
    <div className="overflow-hidden border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Jogador</TableHead>
            <TableHead className="text-right" title="Soma do valor dos gols em que ele marcou ou deu a assistência">
              Pontos
            </TableHead>
            <TableHead className="text-right max-sm:hidden" title="Pontos decisivos por jogo">
              Por jogo
            </TableHead>
            <TableHead className="text-right" title="Vitórias em que ele marcou ou deu assistência">
              V
            </TableHead>
            <TableHead className="pr-4 text-right" title="Empates em que ele marcou ou deu assistência">
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
                  {player.goals}G {player.assists}A que valeram pontos · {plural(player.games, "jogo", "jogos")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={index === 0 ? "figure text-2xl text-primary tabular" : "figure text-2xl tabular"}>
                  {formatDecisivePoints(player.points)}
                </span>
              </TableCell>
              <TableCell className="text-right tabular max-sm:hidden">
                {perGameFormat.format(player.points / player.games)}
              </TableCell>
              <TableCell className="text-right tabular">{player.wins}</TableCell>
              <TableCell className="pr-4 text-right tabular">{player.draws}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
