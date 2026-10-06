import type { Metadata } from "next";
import Link from "next/link";
import { TrophyIcon } from "lucide-react";

import { PeriodNav } from "@/components/layout/PeriodNav";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ShareButton } from "@/components/layout/ShareButton";
import { RatingBadge } from "@/components/players/RatingBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRating } from "@/lib/format";
import { formatMonth, type GameMonth, type MonthAwards } from "@/lib/stats/months";
import type { PeriodPlayerLine } from "@/lib/stats/periods";
import { cn } from "@/lib/utils";

import { loadMonth } from "./load-month";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/awards/[month]">): Promise<Metadata> {
  const { clubId, month: monthId } = await params;
  const { club, month, awards } = await loadMonth(clubId, monthId);
  const title = `Prêmios de ${formatMonth(month.id)}`;
  return {
    title,
    description: awards.goldenBall
      ? `${club.name}: Bola de Ouro para ${awards.goldenBall.playerName}, nota ${formatRating(awards.goldenBall.averageRating)}.`
      : `${club.name}: ${plural(month.matches.length, "partida", "partidas")} no mês.`,
    openGraph: { title: `${club.name} · ${title}` },
  };
}

interface AwardCard {
  label: string;
  line: PeriodPlayerLine | null;
  detail: (line: PeriodPlayerLine) => string;
  tone?: "loss";
}

function awardCards(awards: MonthAwards): AwardCard[] {
  return [
    { label: "Artilheiro", line: awards.topScorer, detail: (line) => plural(line.goals, "gol", "gols") },
    {
      label: "Garçom",
      line: awards.topAssister,
      detail: (line) => plural(line.assists, "assistência", "assistências"),
    },
    { label: "Muralha", line: awards.wall, detail: (line) => plural(line.tackles, "desarme", "desarmes") },
    {
      label: "Bagre do mês",
      line: awards.flop,
      detail: (line) => `nota ${formatRating(line.averageRating)} em ${plural(line.games, "jogo", "jogos")}`,
      tone: "loss",
    },
  ];
}

/** Texto que acompanha o link ao compartilhar no WhatsApp. */
function shareText(clubName: string, month: GameMonth, awards: MonthAwards): string {
  const lines = [`🏆 ${clubName} — Prêmios de ${formatMonth(month.id)}`];
  if (awards.goldenBall) {
    lines.push(`Bola de Ouro: ${awards.goldenBall.playerName} (nota ${formatRating(awards.goldenBall.averageRating)})`);
  }
  for (const card of awardCards(awards)) {
    if (card.line) lines.push(`${card.label}: ${card.line.playerName} (${card.detail(card.line)})`);
  }
  return lines.join("\n");
}

export default async function MonthAwardsPage({ params }: PageProps<"/clubs/[clubId]/awards/[month]">) {
  const { clubId, month: monthId } = await params;
  const { club, month, awards, previousMonthId, nextMonthId } = await loadMonth(clubId, monthId);
  const { record } = month;
  const { goldenBall } = awards;
  const profile = (line: PeriodPlayerLine) => `/clubs/${club.id}/players/${line.playerId}`;

  return (
    <div className="space-y-8">
      <section className="border bg-card px-5 py-7 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="kicker text-primary">Prêmios do mês</span>
            <h2 className="figure text-5xl uppercase sm:text-7xl">{capitalize(formatMonth(month.id))}</h2>
            <p className="text-muted-foreground">
              {plural(month.sessions.length, "noite", "noites")} · {plural(month.matches.length, "partida", "partidas")} ·{" "}
              <span className="font-semibold text-win">{record.wins}V</span>{" "}
              <span className="font-semibold text-draw">{record.draws}E</span>{" "}
              <span className="font-semibold text-loss">{record.losses}D</span>
            </p>
          </div>
          <PeriodNav
            label="Outros meses"
            previousHref={previousMonthId && `/clubs/${club.id}/awards/${previousMonthId}`}
            nextHref={nextMonthId && `/clubs/${club.id}/awards/${nextMonthId}`}
          />
        </div>
      </section>

      {goldenBall && (
        <Link
          href={profile(goldenBall)}
          className="relative flex flex-col gap-1 overflow-hidden bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95 sm:p-8"
        >
          <TrophyIcon
            aria-hidden
            className="pointer-events-none absolute -top-4 -right-4 size-44 stroke-[1] opacity-20 sm:size-56"
          />
          <span className="kicker">Bola de Ouro</span>
          <span className="figure text-5xl break-all uppercase sm:text-7xl">{goldenBall.playerName}</span>
          <span className="font-semibold">
            nota {formatRating(goldenBall.averageRating)} em {plural(goldenBall.games, "jogo", "jogos")}
            {goldenBall.mvps > 0 && ` · ${goldenBall.mvps}× MVP`}
            {` · ${goldenBall.goals}G ${goldenBall.assists}A`}
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {awardCards(awards).map(({ label, line, detail, tone }) =>
          line ? (
            <Link
              key={label}
              href={profile(line)}
              className="flex min-w-0 flex-col gap-1 border bg-card p-4 transition-colors hover:bg-surface"
            >
              <span className={cn("kicker", tone === "loss" ? "text-loss" : "text-muted-foreground")}>{label}</span>
              <span className="truncate font-display text-2xl leading-tight font-bold">{line.playerName}</span>
              <span className={cn("text-sm", tone === "loss" ? "text-loss" : "text-primary")}>{detail(line)}</span>
            </Link>
          ) : (
            <div key={label} className="flex min-w-0 flex-col gap-1 border bg-card p-4">
              <span className="kicker text-muted-foreground">{label}</span>
              <span className="text-sm text-muted-foreground">Ninguém neste mês</span>
            </div>
          ),
        )}
      </div>

      <section>
        <SectionHeading
          title="Todos do mês"
          description={`Bola de Ouro e bagre: entre quem jogou ao menos ${awards.minGames} das ${month.matches.length} partidas.`}
        />
        <div className="overflow-hidden border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Jogador</TableHead>
                <TableHead className="text-right">J</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead className="text-right">A</TableHead>
                <TableHead className="text-right" title="Desarmes">
                  Des
                </TableHead>
                <TableHead className="text-right max-sm:hidden">MVP</TableHead>
                <TableHead className="pr-4 text-right">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {awards.players.map((line) => (
                <TableRow key={line.playerId}>
                  <TableCell className="pl-4 font-semibold">
                    <Link href={profile(line)} className="hover:text-primary">
                      {line.playerName}
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn("text-right tabular", line.games < awards.minGames && "text-muted-foreground")}
                  >
                    {line.games}
                  </TableCell>
                  <TableCell className="text-right tabular">{line.goals}</TableCell>
                  <TableCell className="text-right tabular">{line.assists}</TableCell>
                  <TableCell className="text-right tabular">{line.tackles}</TableCell>
                  <TableCell className="text-right tabular max-sm:hidden">{line.mvps}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <RatingBadge rating={line.averageRating} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <ShareButton
        text={shareText(club.name, month, awards)}
        title={`${club.name} · prêmios do mês`}
        label="Mandar no grupo"
        className="w-full sm:w-auto"
      />
    </div>
  );
}
