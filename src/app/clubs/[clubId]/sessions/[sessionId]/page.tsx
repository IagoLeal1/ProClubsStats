import type { Metadata } from "next";
import Link from "next/link";
import { ShirtIcon, StarIcon } from "lucide-react";

import { BackLink } from "@/components/layout/BackLink";
import { ShareButton } from "@/components/layout/ShareButton";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchCard, MatchList } from "@/components/matches/MatchCard";
import { MatchResult } from "@/components/matches/MatchResult";
import { RatingBadge } from "@/components/players/RatingBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent, formatRating, formatSigned, formatTime, formatWeekdayDate } from "@/lib/format";
import type { GameSession, SessionPlayerLine, SessionSummary } from "@/lib/stats/sessions";
import { weekIdOf } from "@/lib/stats/weeks";
import { cn } from "@/lib/utils";

import { loadSession } from "./load-session";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function recordLabel({ record }: GameSession) {
  return `${record.wins}V ${record.draws}E ${record.losses}D`;
}

/** Texto que acompanha o link ao compartilhar no WhatsApp. */
function shareText(clubName: string, session: GameSession, summary: SessionSummary): string {
  const lines = [
    `⚽ ${clubName} — ${formatWeekdayDate(session.startedAt)}`,
    `${recordLabel(session)} · ${session.record.goalsFor} gols pró, ${session.record.goalsAgainst} contra`,
  ];
  if (summary.mvp) lines.push(`MVP da noite: ${summary.mvp.playerName}`);
  if (summary.topScorer) lines.push(`Artilheiro: ${summary.topScorer.playerName} (${summary.topScorer.goals})`);
  return lines.join("\n");
}

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/sessions/[sessionId]">): Promise<Metadata> {
  const { clubId, sessionId } = await params;
  const { club, session } = await loadSession(clubId, sessionId);
  const title = `Resumo de ${formatWeekdayDate(session.startedAt)}`;
  return {
    title,
    description: `${club.name}: ${recordLabel(session)} em ${session.matches.length} partidas.`,
    openGraph: { title: `${club.name} · ${title}` },
  };
}

interface Highlight {
  label: string;
  value: string;
  detail: string;
  href?: string;
  tone?: "primary" | "muted" | "loss";
}

function buildHighlights(
  session: GameSession,
  summary: SessionSummary,
  profile: (line: SessionPlayerLine) => string,
): Highlight[] {
  const { record } = session;
  const highlights: Highlight[] = [];
  if (summary.topScorer) {
    highlights.push({
      label: "Artilheiro",
      value: summary.topScorer.playerName,
      detail: plural(summary.topScorer.goals, "gol", "gols"),
      href: profile(summary.topScorer),
    });
  }
  if (summary.topAssister) {
    highlights.push({
      label: "Garçom",
      value: summary.topAssister.playerName,
      detail: plural(summary.topAssister.assists, "assistência", "assistências"),
      href: profile(summary.topAssister),
    });
  }
  highlights.push({
    label: "Saldo",
    value: formatSigned(record.goalsFor - record.goalsAgainst),
    detail: `${record.goalsFor} feitos, ${record.goalsAgainst} sofridos`,
    tone: "muted",
  });
  if (summary.worstRating && summary.worstRating.playerId !== summary.bestRating?.playerId) {
    highlights.push({
      label: "Nota mais baixa",
      value: summary.worstRating.playerName,
      detail: `média ${formatRating(summary.worstRating.averageRating)}`,
      href: profile(summary.worstRating),
      tone: "loss",
    });
  }
  return highlights;
}

const DETAIL_TONES = { primary: "text-primary", muted: "text-muted-foreground", loss: "text-loss" } as const;

export default async function SessionPage({ params }: PageProps<"/clubs/[clubId]/sessions/[sessionId]">) {
  const { clubId, sessionId } = await params;
  const { club, session, summary } = await loadSession(clubId, sessionId);
  const { record } = session;
  const games = session.matches.length;
  const pointsRate = ((record.wins * 3 + record.draws) / (games * 3)) * 100;
  const profile = (line: SessionPlayerLine) => `/clubs/${club.id}/players/${line.playerId}`;
  const highlights = buildHighlights(session, summary, profile);

  return (
    <div className="space-y-8">
      <BackLink href={`/clubs/${club.id}/matches`}>Partidas</BackLink>

      <section className="relative overflow-hidden border bg-card px-5 py-7 sm:px-8 sm:py-9">
        <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-[360px] -translate-1/2 rounded-full border-2 border-[#1e2026]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 bg-[#1e2026]" />
        <div className="relative flex flex-col gap-4">
          <span className="kicker text-primary">Resumo da noite</span>
          <div className="space-y-1">
            <h2 className="figure text-5xl uppercase sm:text-7xl">{formatWeekdayDate(session.startedAt)}</h2>
            <p className="text-muted-foreground">
              {formatTime(session.startedAt)}–{formatTime(session.endedAt)} · {plural(games, "partida", "partidas")}
            </p>
          </div>
          <p className="figure flex flex-wrap items-baseline gap-x-4 text-7xl sm:text-8xl">
            <span className="text-win">{record.wins}V</span>
            <span className="text-draw">{record.draws}E</span>
            <span className="text-loss">{record.losses}D</span>
          </p>
          <p className="text-muted-foreground">
            {record.goalsFor} gols feitos · {record.goalsAgainst} sofridos · {formatPercent(pointsRate)} de
            aproveitamento
          </p>
          <div className="flex flex-wrap gap-1.5" aria-label="Resultados da noite em ordem">
            {session.matches.map((match) => (
              <MatchResult key={match.id} result={match.result} size="sm" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {summary.mvp && (
          <Link
            href={profile(summary.mvp)}
            className="relative flex flex-col justify-end gap-1 overflow-hidden bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95"
          >
            <StarIcon
              aria-hidden
              className="pointer-events-none absolute -top-6 -right-6 size-40 stroke-[1] opacity-20"
            />
            <span className="kicker">MVP da noite</span>
            <span className="figure text-5xl break-all uppercase">{summary.mvp.playerName}</span>
            <span className="font-semibold">
              {summary.mvp.mvps}× MVP · nota média {formatRating(summary.mvp.averageRating)} em{" "}
              {plural(summary.mvp.games, "jogo", "jogos")}
            </span>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-3">
          {highlights.map((highlight) => {
            const content = (
              <>
                <span className="kicker text-muted-foreground">{highlight.label}</span>
                <span className="truncate font-display text-2xl leading-tight font-bold">{highlight.value}</span>
                <span className={cn("text-sm", DETAIL_TONES[highlight.tone ?? "primary"])}>{highlight.detail}</span>
              </>
            );
            const className = "flex min-w-0 flex-col gap-1 border bg-card p-4";
            return highlight.href ? (
              <Link key={highlight.label} href={highlight.href} className={cn(className, "transition-colors hover:bg-surface")}>
                {content}
              </Link>
            ) : (
              <div key={highlight.label} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading title="Jogadores da noite" description="Notas médias valem para quem jogou ao menos metade da noite" />
        <div className="border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Jogador</TableHead>
                <TableHead className="text-right">J</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead className="text-right">A</TableHead>
                <TableHead className="text-right">MVP</TableHead>
                <TableHead className="pr-4 text-right">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.players.map((line) => (
                <TableRow key={line.playerId}>
                  <TableCell className="pl-4 font-semibold">
                    <Link href={profile(line)} className="hover:text-primary">
                      {line.playerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular">{line.games}</TableCell>
                  <TableCell className="text-right tabular">{line.goals}</TableCell>
                  <TableCell className="text-right tabular">{line.assists}</TableCell>
                  <TableCell className="text-right tabular">{line.mvps}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <RatingBadge rating={line.averageRating} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <SectionHeading title="Jogo a jogo" description="Em ordem, da primeira à última" />
        <MatchList>
          {session.matches.map((match) => (
            <MatchCard key={match.id} match={match} dateStyle="time" />
          ))}
        </MatchList>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <ShareButton
          text={shareText(club.name, session, summary)}
          title={`${club.name} · resumo da noite`}
          label="Mandar no grupo"
          className="w-full sm:w-auto"
        />
        <Link
          href={`/clubs/${club.id}/team-of-the-week/${weekIdOf(session.startedAt)}`}
          className="flex h-12 items-center justify-center gap-2.5 border border-input px-6 font-display text-lg font-bold tracking-[0.08em] uppercase transition-colors hover:bg-surface"
        >
          <ShirtIcon className="size-5" aria-hidden /> Time da semana
        </Link>
      </div>
    </div>
  );
}
