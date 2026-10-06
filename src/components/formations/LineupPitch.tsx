import Link from "next/link";

import { RatingBadge } from "@/components/players/RatingBadge";
import type { ChemistryLink, LineupCard } from "@/lib/formations/lineup-view";
import { formatPositionGroupShort } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FootballPitch } from "./FootballPitch";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

function RoleBadges({ card }: { card: LineupCard }) {
  if (card.roles.length === 0) return null;
  return (
    <span className="absolute -top-2 -right-2 flex gap-0.5">
      {card.roles.map(({ role, label, badge }) => (
        <span
          key={role}
          title={label}
          className="grid size-[18px] place-items-center rounded-full border-2 border-background bg-primary font-display text-[10px] font-extrabold text-primary-foreground"
        >
          {badge}
          <span className="sr-only">: {label}</span>
        </span>
      ))}
    </span>
  );
}

/** Carta estilo FUT de uma vaga: OVR, posição, nome, arquétipo, nota no setor e fase. */
function PlayerCard({ clubId, card }: { clubId: string; card: LineupCard }) {
  const style = { left: `${clamp(card.x)}%`, bottom: `${clamp(card.y)}%` };
  const base = "absolute flex w-16 -translate-x-1/2 translate-y-1/2 flex-col items-stretch sm:w-[5.5rem]";

  if (!card.playerId) {
    return (
      <div className={cn(base, "border border-dashed border-input bg-background/70 px-1.5 py-1.5 text-center")} style={style}>
        <span className="font-display text-[11px] font-bold text-muted-foreground sm:text-xs">{card.position}</span>
        <span className="font-display text-sm font-bold text-muted-foreground">IA</span>
      </div>
    );
  }

  const trend = card.form?.trend;
  return (
    <Link
      href={`/clubs/${clubId}/players/${card.playerId}`}
      className={cn(
        base,
        "group gap-0.5 border border-t-2 border-input border-t-primary bg-card/95 px-1.5 py-1 shadow-[0_6px_16px_rgb(0_0_0/0.45)] transition-transform hover:z-10 hover:scale-105 sm:px-2 sm:py-1.5",
      )}
      style={style}
    >
      <RoleBadges card={card} />
      <span className="flex items-baseline justify-between gap-1">
        <span className="figure text-lg sm:text-2xl">{card.overall ?? "—"}</span>
        <span className="font-display text-[11px] font-bold text-muted-foreground sm:text-xs">{card.position}</span>
      </span>
      <span className="truncate text-[11px] leading-tight font-semibold sm:text-xs">{card.name}</span>
      <span className="truncate font-display text-[10px] leading-tight font-bold tracking-[0.04em] text-primary uppercase sm:text-[11px]">
        {card.archetype?.name ?? " "}
      </span>
      <span className="mt-0.5 flex items-center justify-between gap-1">
        {card.sectorRating ? (
          <span
            title={`Nota média de ${formatPositionGroupShort(card.group)} em ${card.sectorRating.games} jogos`}
            className="inline-flex"
          >
            <RatingBadge rating={card.sectorRating.averageRating} className="min-w-0 px-1 py-0 text-xs sm:text-[13px]" />
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">sem nota</span>
        )}
        {trend && trend !== "steady" && (
          <span
            className={cn("font-display text-xs font-extrabold", trend === "up" ? "text-win" : "text-loss")}
            title={trend === "up" ? "Em alta" : "Em baixa"}
          >
            {trend === "up" ? "▲" : "▼"}
            <span className="sr-only">{trend === "up" ? "Em alta" : "Em baixa"}</span>
          </span>
        )}
      </span>
    </Link>
  );
}

interface LineupPitchProps {
  clubId: string;
  cards: LineupCard[];
  chemistry: ChemistryLink[];
  className?: string;
}

/** Escalação de TV: cartas no campo e linhas de química por baixo. */
export function LineupPitch({ clubId, cards, chemistry, className }: LineupPitchProps) {
  const strongest = Math.max(1, ...chemistry.map((link) => link.assists));
  return (
    <FootballPitch className={className}>
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
        {chemistry.map((link) => (
          <line
            key={`${link.a.slotIndex}-${link.b.slotIndex}`}
            x1={clamp(link.a.x)}
            y1={100 - clamp(link.a.y)}
            x2={clamp(link.b.x)}
            y2={100 - clamp(link.b.y)}
            className="stroke-primary"
            strokeOpacity={0.35 + (0.5 * link.assists) / strongest}
            strokeWidth={2 + (4 * link.assists) / strongest}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {cards.map((card) => (
        <PlayerCard key={card.slotIndex} clubId={clubId} card={card} />
      ))}
    </FootballPitch>
  );
}
