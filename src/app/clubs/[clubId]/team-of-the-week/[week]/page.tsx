import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from "lucide-react";

import { ShareButton } from "@/components/layout/ShareButton";
import { RatingBadge } from "@/components/players/RatingBadge";
import { TeamOfTheWeekPitch } from "@/components/weeks/TeamOfTheWeekPitch";
import { formatPositionGroup, formatRating } from "@/lib/format";
import { formatWeekRange, type GameWeek, type TeamOfTheWeek, type WeekPlayerLine } from "@/lib/stats/weeks";
import { cn } from "@/lib/utils";

import { loadWeek } from "./load-week";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/team-of-the-week/[week]">): Promise<Metadata> {
  const { clubId, week: weekId } = await params;
  const { club, week, team } = await loadWeek(clubId, weekId);
  const title = `Time da semana · ${formatWeekRange(week.id)}`;
  return {
    title,
    description: team.star
      ? `${club.name}: craque da semana ${team.star.playerName}, nota ${formatRating(team.star.averageRating)}.`
      : `${club.name}: ${plural(week.matches.length, "partida", "partidas")} na semana.`,
    openGraph: { title: `${club.name} · ${title}` },
  };
}

/** Texto que acompanha o link ao compartilhar no WhatsApp. */
function shareText(clubName: string, week: GameWeek, team: TeamOfTheWeek): string {
  const lines = [`⚽ ${clubName} — Time da semana (${formatWeekRange(week.id)})`];
  if (team.star) lines.push(`Craque: ${team.star.playerName} (nota ${formatRating(team.star.averageRating)})`);
  if (team.lineup.length > 0) {
    lines.push(
      `Titulares: ${team.lineup.map((line) => `${line.playerName} ${formatRating(line.averageRating)}`).join(" · ")}`,
    );
  }
  return lines.join("\n");
}

/** Por que ficou no banco: poucos jogos ou setor já completo. */
function benchReason(line: WeekPlayerLine, minGames: number): string {
  if (line.games < minGames) return `${plural(line.games, "jogo", "jogos")} (mínimo ${minGames})`;
  if (line.position === null || line.averageRating === null) return "sem nota ou setor";
  return `${formatPositionGroup(line.position).toLowerCase()} completo`;
}

function topBy(lines: WeekPlayerLine[], value: (line: WeekPlayerLine) => number): WeekPlayerLine | null {
  return (
    [...lines].filter((line) => value(line) > 0).sort((a, b) => value(b) - value(a) || a.games - b.games)[0] ?? null
  );
}

const navLinkClass =
  "inline-flex h-11 items-center gap-1.5 border border-input px-3.5 font-display text-base font-bold tracking-[0.06em] uppercase transition-colors hover:bg-surface";

function WeekNav({ clubId, previousWeekId, nextWeekId }: { clubId: string; previousWeekId: string | null; nextWeekId: string | null }) {
  const items = [
    { weekId: previousWeekId, label: "Anterior", icon: ArrowLeftIcon, before: true },
    { weekId: nextWeekId, label: "Próxima", icon: ArrowRightIcon, before: false },
  ];
  return (
    <nav aria-label="Outras semanas" className="flex gap-2">
      {items.map(({ weekId, label, icon: Icon, before }) => {
        const content = (
          <>
            {before && <Icon className="size-4" aria-hidden />}
            {label}
            {!before && <Icon className="size-4" aria-hidden />}
          </>
        );
        return weekId ? (
          <Link key={label} href={`/clubs/${clubId}/team-of-the-week/${weekId}`} className={navLinkClass}>
            {content}
          </Link>
        ) : (
          <span key={label} aria-disabled className={cn(navLinkClass, "pointer-events-none opacity-40")}>
            {content}
          </span>
        );
      })}
    </nav>
  );
}

export default async function TeamOfTheWeekPage({ params }: PageProps<"/clubs/[clubId]/team-of-the-week/[week]">) {
  const { clubId, week: weekId } = await params;
  const { club, week, team, previousWeekId, nextWeekId } = await loadWeek(clubId, weekId);
  const { record } = week;
  const profile = (line: WeekPlayerLine) => `/clubs/${club.id}/players/${line.playerId}`;
  const everyone = [...team.lineup, ...team.bench];
  const highlights = [
    { label: "Artilheiro", line: topBy(everyone, (line) => line.goals), detail: (line: WeekPlayerLine) => plural(line.goals, "gol", "gols") },
    {
      label: "Garçom",
      line: topBy(everyone, (line) => line.assists),
      detail: (line: WeekPlayerLine) => plural(line.assists, "assistência", "assistências"),
    },
  ];

  return (
    <div className="space-y-8">
      <section className="border bg-card px-5 py-7 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="kicker text-primary">Time da semana</span>
            <h2 className="figure text-5xl uppercase sm:text-7xl">{formatWeekRange(week.id)}</h2>
            <p className="text-muted-foreground">
              {plural(week.sessions.length, "noite", "noites")} · {plural(week.matches.length, "partida", "partidas")} ·{" "}
              <span className="font-semibold text-win">{record.wins}V</span>{" "}
              <span className="font-semibold text-draw">{record.draws}E</span>{" "}
              <span className="font-semibold text-loss">{record.losses}D</span>
            </p>
          </div>
          <WeekNav clubId={club.id} previousWeekId={previousWeekId} nextWeekId={nextWeekId} />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-2">
          <TeamOfTheWeekPitch clubId={club.id} team={team} />
          <p className="text-xs text-muted-foreground">
            Nota média da semana no círculo. Titular é quem jogou ao menos {team.minGames} das{" "}
            {week.matches.length} partidas, no setor em que mais jogou — com as vagas de um 4-3-3.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {team.star && (
            <Link
              href={profile(team.star)}
              className="relative flex flex-col gap-1 overflow-hidden bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95"
            >
              <StarIcon
                aria-hidden
                className="pointer-events-none absolute -top-6 -right-6 size-40 stroke-[1] opacity-20"
              />
              <span className="kicker">Craque da semana</span>
              <span className="figure text-5xl break-all uppercase">{team.star.playerName}</span>
              <span className="font-semibold">
                nota {formatRating(team.star.averageRating)} em {plural(team.star.games, "jogo", "jogos")}
                {team.star.mvps > 0 && ` · ${team.star.mvps}× MVP`}
                {` · ${team.star.goals}G ${team.star.assists}A`}
              </span>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            {highlights.map(({ label, line, detail }) =>
              line ? (
                <Link
                  key={label}
                  href={profile(line)}
                  className="flex min-w-0 flex-col gap-1 border bg-card p-4 transition-colors hover:bg-surface"
                >
                  <span className="kicker text-muted-foreground">{label}</span>
                  <span className="truncate font-display text-2xl leading-tight font-bold">{line.playerName}</span>
                  <span className="text-sm text-primary">{detail(line)}</span>
                </Link>
              ) : (
                <div key={label} className="flex min-w-0 flex-col gap-1 border bg-card p-4">
                  <span className="kicker text-muted-foreground">{label}</span>
                  <span className="text-sm text-muted-foreground">Ninguém nesta semana</span>
                </div>
              ),
            )}
          </div>

          {team.bench.length > 0 && (
            <section className="border bg-card p-4 sm:p-5">
              <h3 className="kicker text-muted-foreground">Banco</h3>
              <ul className="mt-2 divide-y">
                {team.bench.map((line) => (
                  <li key={line.playerId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={profile(line)} className="block truncate font-semibold hover:text-primary">
                        {line.playerName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{benchReason(line, team.minGames)}</p>
                    </div>
                    <RatingBadge rating={line.averageRating} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <ShareButton
        text={shareText(club.name, week, team)}
        title={`${club.name} · time da semana`}
        label="Mandar no grupo"
        className="w-full sm:w-auto"
      />
    </div>
  );
}
