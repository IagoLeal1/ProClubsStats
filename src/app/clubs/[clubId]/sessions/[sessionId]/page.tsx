import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ShareButton } from "@/components/layout/ShareButton";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MatchCard } from "@/components/matches/MatchCard";
import { MatchResult } from "@/components/matches/MatchResult";
import { RatingBadge } from "@/components/players/RatingBadge";
import { RecordCard } from "@/components/records/RecordCard";
import { StatCard } from "@/components/stats/StatCard";
import { buttonVariants } from "@/components/ui/button";
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

function highlightDetail(line: SessionPlayerLine, extra: string) {
  return `${extra} · nota ${formatRating(line.averageRating)}`;
}

export default async function SessionPage({ params }: PageProps<"/clubs/[clubId]/sessions/[sessionId]">) {
  const { clubId, sessionId } = await params;
  const { club, session, summary } = await loadSession(clubId, sessionId);
  const { record } = session;
  const games = session.matches.length;
  const pointsRate = ((record.wins * 3 + record.draws) / (games * 3)) * 100;
  const profile = (line: SessionPlayerLine) => `/clubs/${club.id}/players/${line.playerId}`;

  return (
    <div className="space-y-8">
      <Link
        href={`/clubs/${club.id}/matches`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
      >
        <ArrowLeftIcon data-icon="inline-start" /> Partidas
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Resumo da noite</p>
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            {formatWeekdayDate(session.startedAt)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatTime(session.startedAt)}–{formatTime(session.endedAt)} · {plural(games, "partida", "partidas")}
          </p>
        </div>
        <ShareButton text={shareText(club.name, session, summary)} title={`${club.name} · resumo da noite`} />
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Resultados da noite em ordem">
        {session.matches.map((match) => (
          <MatchResult key={match.id} result={match.result} size="sm" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Campanha" value={recordLabel(session)} hint={`${formatPercent(pointsRate)} de aproveitamento`} />
        <StatCard
          label="Gols"
          value={`${record.goalsFor}–${record.goalsAgainst}`}
          hint={`saldo ${formatSigned(record.goalsFor - record.goalsAgainst)}`}
        />
        <StatCard
          label="Vitórias"
          value={formatPercent((record.wins / games) * 100)}
          hint={plural(record.wins, "vitória", "vitórias")}
          tone="win"
        />
      </div>

      <section>
        <SectionHeading title="Destaques" description="Notas médias contam para quem jogou ao menos metade da noite" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {summary.mvp && (
            <RecordCard
              label="MVP da noite"
              value={summary.mvp.playerName}
              detail={highlightDetail(summary.mvp, `${summary.mvp.mvps}× MVP`)}
              href={profile(summary.mvp)}
              tone="win"
            />
          )}
          {summary.topScorer && (
            <RecordCard
              label="Artilheiro"
              value={summary.topScorer.playerName}
              detail={plural(summary.topScorer.goals, "gol", "gols")}
              href={profile(summary.topScorer)}
            />
          )}
          {summary.topAssister && (
            <RecordCard
              label="Garçom"
              value={summary.topAssister.playerName}
              detail={plural(summary.topAssister.assists, "assistência", "assistências")}
              href={profile(summary.topAssister)}
            />
          )}
          {summary.bestRating && (
            <RecordCard
              label="Melhor nota média"
              value={summary.bestRating.playerName}
              detail={`nota ${formatRating(summary.bestRating.averageRating)}`}
              href={profile(summary.bestRating)}
            />
          )}
          {summary.worstRating && summary.worstRating.playerId !== summary.bestRating?.playerId && (
            <RecordCard
              label="Menor nota média"
              value={summary.worstRating.playerName}
              detail={`nota ${formatRating(summary.worstRating.averageRating)}`}
              href={profile(summary.worstRating)}
            />
          )}
        </div>
      </section>

      <section>
        <SectionHeading title="Jogadores da noite" />
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Jogador</TableHead>
                <TableHead className="text-right">J</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead className="text-right">A</TableHead>
                <TableHead className="text-right">MVP</TableHead>
                <TableHead className="text-right">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.players.map((line) => (
                <TableRow key={line.playerId}>
                  <TableCell className="pl-4 font-medium">
                    <Link href={profile(line)} className="hover:underline">
                      {line.playerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular">{line.games}</TableCell>
                  <TableCell className="text-right tabular">{line.goals}</TableCell>
                  <TableCell className="text-right tabular">{line.assists}</TableCell>
                  <TableCell className="text-right tabular">{line.mvps}</TableCell>
                  <TableCell className="text-right">
                    <RatingBadge rating={line.averageRating} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <SectionHeading title="Partidas da noite" description="Em ordem, da primeira à última" />
        <div className="space-y-2">
          {session.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
