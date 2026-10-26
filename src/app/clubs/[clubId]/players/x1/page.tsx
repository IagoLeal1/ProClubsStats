import type { Metadata } from "next";
import Link from "next/link";
import { CrownIcon, SwordsIcon } from "lucide-react";

import { BackLink } from "@/components/layout/BackLink";
import { EmptyState } from "@/components/layout/EmptyState";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ShareButton } from "@/components/layout/ShareButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSigned } from "@/lib/format";
import { MIN_X1_GAMES, x1Key, type X1Line, type X1Table } from "@/lib/stats/x1";
import { cn } from "@/lib/utils";

import { loadX1 } from "./load-x1";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const balance = (line: X1Line) => line.statsFor - line.statsAgainst;
const campaign = (line: X1Line) => `${line.wins}V ${line.draws}E ${line.losses}D`;

export async function generateMetadata({ params }: PageProps<"/clubs/[clubId]/players/x1">): Promise<Metadata> {
  const { clubId } = await params;
  const { club, table } = await loadX1(clubId);
  const king = table.lines[0];
  return {
    title: "Rei do x1",
    description: king
      ? `${club.name}: ${king.playerName} é o Rei do x1, com ${king.points} pontos (${campaign(king)}).`
      : `${club.name}: todos contra todos no x1.`,
    openGraph: { title: `${club.name} · Rei do x1` },
  };
}

/** Texto que acompanha o link ao compartilhar no WhatsApp. */
function shareText(clubName: string, table: X1Table): string {
  return [
    `🏆 ${clubName} — Rei do x1`,
    ...table.lines.map(
      (line, index) => `${index + 1}. ${line.playerName} — ${line.points} pts (${campaign(line)}, saldo ${formatSigned(balance(line))})`,
    ),
  ].join("\n");
}

function KingCard({ clubId, king }: { clubId: string; king: X1Line }) {
  return (
    <Link
      href={`/clubs/${clubId}/players/${king.playerId}`}
      className="relative flex flex-col gap-1 overflow-hidden bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95 sm:p-8"
    >
      <CrownIcon
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 size-44 stroke-[1] opacity-20 sm:size-56"
      />
      <span className="kicker">Rei do x1</span>
      <span className="figure text-5xl break-all uppercase sm:text-7xl">{king.playerName}</span>
      <span className="font-semibold">
        {king.points} pontos · {plural(king.wins, "vitória", "vitórias")}, {plural(king.draws, "empate", "empates")} e{" "}
        {plural(king.losses, "derrota", "derrotas")} em {plural(king.duels, "duelo", "duelos")} · saldo{" "}
        {formatSigned(balance(king))}
      </span>
    </Link>
  );
}

function Standings({ clubId, lines }: { clubId: string; lines: X1Line[] }) {
  return (
    <div className="overflow-hidden border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-4">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead className="text-right max-sm:hidden" title="Duelos">
              J
            </TableHead>
            <TableHead className="text-right" title="Vitórias">
              V
            </TableHead>
            <TableHead className="text-right" title="Empates">
              E
            </TableHead>
            <TableHead className="text-right" title="Derrotas">
              D
            </TableHead>
            <TableHead className="text-right max-sm:hidden" title="Estatísticas vencidas menos perdidas">
              Saldo
            </TableHead>
            <TableHead className="pr-4 text-right" title="3 por vitória, 1 por empate">
              Pts
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={line.playerId}>
              <TableCell className={cn("pl-4 figure text-xl", index === 0 ? "text-primary" : "text-muted-foreground")}>
                {index + 1}
              </TableCell>
              <TableCell>
                <Link href={`/clubs/${clubId}/players/${line.playerId}`} className="font-semibold hover:text-primary">
                  {line.playerName}
                </Link>
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular max-sm:hidden">{line.duels}</TableCell>
              <TableCell className="text-right tabular">{line.wins}</TableCell>
              <TableCell className="text-right tabular">{line.draws}</TableCell>
              <TableCell className="text-right tabular">{line.losses}</TableCell>
              <TableCell className="text-right tabular max-sm:hidden">{formatSigned(balance(line))}</TableCell>
              <TableCell className="pr-4 text-right">
                <span className={cn("figure text-2xl tabular", index === 0 && "text-primary")}>{line.points}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Grade de todos os confrontos: o placar é do ponto de vista da linha. */
function DuelGrid({ clubId, table }: { clubId: string; table: X1Table }) {
  const { lines, duels } = table;
  return (
    <div className="overflow-x-auto border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card p-3 text-left">
              <span className="sr-only">Jogador</span>
            </th>
            {lines.map((line) => (
              <th key={line.playerId} scope="col" className="max-w-24 p-3 text-center">
                <span className="kicker block truncate text-[11px] text-muted-foreground" title={line.playerName}>
                  {line.playerName}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((row) => (
            <tr key={row.playerId} className="border-t">
              <th scope="row" className="sticky left-0 z-10 max-w-36 truncate bg-card p-3 text-left font-semibold">
                {row.playerName}
              </th>
              {lines.map((column) => {
                if (row.playerId === column.playerId) {
                  return <td key={column.playerId} className="bg-muted/40 p-1" aria-hidden />;
                }
                const duel = duels.get(x1Key(row.playerId, column.playerId));
                if (!duel) {
                  return (
                    <td
                      key={column.playerId}
                      className="p-1 text-center text-muted-foreground"
                      title={`Menos de ${MIN_X1_GAMES} jogos juntos`}
                    >
                      —
                    </td>
                  );
                }
                const { a, b } = duel.score;
                return (
                  <td key={column.playerId} className="p-1 text-center">
                    <Link
                      href={`/clubs/${clubId}/players/${row.playerId}/vs/${column.playerId}`}
                      title={`${row.playerName} ${a} × ${b} ${column.playerName} em ${duel.games} jogos juntos`}
                      className={cn(
                        "block min-w-16 rounded-sm px-2 py-2 font-display text-base font-bold tabular transition-opacity hover:opacity-80",
                        a > b ? "bg-win/15 text-win" : a < b ? "bg-loss/15 text-loss" : "bg-draw/15 text-foreground",
                      )}
                    >
                      {a}×{b}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function X1Page({ params }: PageProps<"/clubs/[clubId]/players/x1">) {
  const { clubId } = await params;
  const { club, table } = await loadX1(clubId);
  const [king] = table.lines;

  return (
    <div className="space-y-8">
      <BackLink href={`/clubs/${club.id}/players`}>Jogadores</BackLink>

      <SectionHeading
        title="Rei do x1"
        description={`Todos contra todos no elenco. Cada duelo usa os jogos em que os dois estavam em campo (mínimo ${MIN_X1_GAMES}) e compara gols, assistências, pré-assistências, passes certos e errados, conversão e desarmes. Vitória vale 3 pontos, empate 1; o saldo é de estatísticas vencidas.`}
      />

      {king ? (
        <>
          <div className="space-y-3">
            <KingCard clubId={club.id} king={king} />
            <ShareButton
              text={shareText(club.name, table)}
              title={`${club.name} · Rei do x1`}
              label="Mandar no grupo"
              className="w-full sm:w-auto"
            />
          </div>

          <section>
            <SectionHeading title="Tabela" />
            <Standings clubId={club.id} lines={table.lines} />
          </section>

          <section>
            <SectionHeading
              title="Todos os duelos"
              description="Placar de cada duelo do ponto de vista da linha (estatísticas vencidas). Toque para abrir o duelo."
            />
            <DuelGrid clubId={club.id} table={table} />
          </section>
        </>
      ) : (
        <EmptyState
          icon={SwordsIcon}
          title="Ainda sem duelos"
          description={`O x1 precisa de pelo menos dois membros com ${MIN_X1_GAMES} jogos juntos nas partidas salvas.`}
        />
      )}
    </div>
  );
}
