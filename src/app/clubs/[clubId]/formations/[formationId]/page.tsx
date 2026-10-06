import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRightIcon, PencilIcon } from "lucide-react";

import { LineupPitch } from "@/components/formations/LineupPitch";
import { BackLink } from "@/components/layout/BackLink";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ShareButton } from "@/components/layout/ShareButton";
import { RatingBadge } from "@/components/players/RatingBadge";
import { formatPositionGroupShort, formatRating, formatRelativeTime } from "@/lib/format";
import { attributeLabel } from "@/lib/formations/attributes";
import type { LineupCard, LineupView } from "@/lib/formations/lineup-view";
import { SLOTS_PER_FORMATION } from "@/lib/formations/templates";
import { FORMATION_ROLES, type Formation } from "@/types/formation";

import { loadFormation, loadLineup } from "./load-formation";

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/formations/[formationId]">): Promise<Metadata> {
  const { clubId, formationId } = await params;
  const { club, formation } = await loadFormation(clubId, formationId);
  return {
    title: formation.name,
    description: `${club.name}: escalação "${formation.name}" no ${formation.formationType}.`,
    openGraph: { title: `${club.name} · ${formation.name} (${formation.formationType})` },
  };
}

/** Texto que acompanha o link ao compartilhar no WhatsApp. */
function shareText(clubName: string, formation: Formation, view: LineupView): string {
  const lineup = view.cards.map((card) => `${card.position} ${card.name ?? "IA"}`).join(" · ");
  const captain = view.cards.find((card) => card.roles.some(({ role }) => role === "captain"));
  const lines = [`⚽ ${clubName} — ${formation.name} (${formation.formationType})`, lineup];
  if (captain) lines.push(`Capitão: ${captain.name}`);
  return lines.join("\n");
}

function SummaryTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface/60 p-3">
      <span className="kicker text-[11px] text-muted-foreground">{label}</span>
      <span className="figure text-3xl">{value}</span>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
    </div>
  );
}

function TeamSheet({ view }: { view: LineupView }) {
  const { summary } = view;
  const roleHolder = (role: string) => view.cards.find((card) => card.roles.some((info) => info.role === role));

  return (
    <div className="flex flex-col gap-3">
      <section className="space-y-3 border bg-card p-4 sm:p-5">
        <h3 className="kicker text-primary">Ficha do time</h3>
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile
            label="OVR médio"
            value={summary.averageOverall === null ? "—" : String(Math.round(summary.averageOverall))}
            detail="dos Pros escalados"
          />
          <SummaryTile
            label="Nota no setor"
            value={formatRating(summary.averageSectorRating)}
            detail="média de cada um na vaga"
          />
          <SummaryTile label="Escalados" value={String(summary.humans)} detail={`+ ${SLOTS_PER_FORMATION - summary.humans} da IA`} />
          <SummaryTile
            label="Química"
            value={String(summary.chemistryAssists)}
            detail="assistências entre eles"
          />
        </div>
      </section>

      <section className="space-y-2 border bg-card p-4 sm:p-5">
        <h3 className="kicker text-primary">Capitão e bola parada</h3>
        <ul className="divide-y">
          {FORMATION_ROLES.map(({ role, label, badge }) => {
            const holder = roleHolder(role);
            return (
              <li key={role} className="flex items-center gap-3 py-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-display text-xs font-extrabold text-primary-foreground">
                  {badge}
                </span>
                <span className="w-24 text-sm text-muted-foreground">{label}</span>
                <span className="truncate font-semibold">{holder?.name ?? <span className="font-normal text-muted-foreground">—</span>}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {view.chemistry.length > 0 && (
        <section className="space-y-2 border bg-card p-4 sm:p-5">
          <h3 className="kicker text-primary">Linhas de química</h3>
          <p className="text-xs text-muted-foreground">
            Assistências confirmadas entre os escalados. No campo, linha mais grossa = mais assistências.
          </p>
          <ul className="space-y-2 pt-1">
            {view.chemistry.map((link) => (
              <li key={`${link.a.slotIndex}-${link.b.slotIndex}`} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                  <span className="truncate">{link.a.name}</span>
                  <ArrowLeftRightIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label="e" />
                  <span className="truncate">{link.b.name}</span>
                </span>
                <span className="figure shrink-0 text-2xl text-primary">{link.assists}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SlotDetail({ card }: { card: LineupCard }) {
  return (
    <li className="flex gap-3 border bg-card p-4">
      <span className="clip-slant-sm h-7 w-12 shrink-0 bg-primary text-center font-display text-sm leading-7 font-extrabold text-primary-foreground">
        {card.position}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-display text-xl leading-tight font-bold">
            {card.name}
            {card.overall !== null && <span className="ml-2 text-base text-muted-foreground">{card.overall} OVR</span>}
          </span>
          {card.sectorRating && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {formatPositionGroupShort(card.group)} em {card.sectorRating.games} jogos
              <RatingBadge rating={card.sectorRating.averageRating} />
            </span>
          )}
        </div>
        {card.archetype && (
          <p className="text-sm">
            <span className="font-semibold text-primary">{card.archetype.name}</span>
            <span className="text-muted-foreground"> · {card.archetype.signature} · {card.archetype.description}</span>
          </p>
        )}
        {card.strengths.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Pontos fortes">
            {card.strengths.map((strength) => (
              <li key={strength} className="rounded-full border border-input px-2.5 py-0.5 text-xs font-semibold">
                {attributeLabel(strength)}
              </li>
            ))}
          </ul>
        )}
        {card.notes && <p className="text-sm text-muted-foreground italic">“{card.notes}”</p>}
      </div>
    </li>
  );
}

export default async function FormationPage({ params }: PageProps<"/clubs/[clubId]/formations/[formationId]">) {
  const { clubId, formationId } = await params;
  const { club, formation, view } = await loadLineup(clubId, formationId);
  const editHref = `/clubs/${club.id}/formations/${formation.id}/edit`;
  const humans = view.cards.filter((card) => card.playerId !== null);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackLink href={`/clubs/${club.id}/formations`}>Formações</BackLink>
        <section className="flex flex-wrap items-end justify-between gap-5 border bg-card px-5 py-6 sm:px-8">
          <div className="min-w-0 space-y-1.5">
            <span className="kicker text-primary">Escalação · {formation.formationType}</span>
            <h2 className="figure text-5xl break-words uppercase sm:text-7xl">{formation.name}</h2>
            <p className="text-sm text-muted-foreground">Atualizada {formatRelativeTime(formation.updatedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={editHref}
              className="inline-flex h-12 items-center gap-2 border border-input px-5 font-display text-lg font-bold tracking-[0.08em] uppercase transition-colors hover:bg-surface"
            >
              <PencilIcon className="size-4" aria-hidden /> Editar
            </Link>
            <ShareButton
              text={shareText(club.name, formation, view)}
              title={`${club.name} · ${formation.name}`}
              label="Mandar no grupo"
            />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <div className="space-y-2">
          <LineupPitch clubId={club.id} cards={view.cards} chemistry={view.chemistry} />
          <p className="text-xs text-muted-foreground">
            Carta: OVR do Pro, vaga, arquétipo e nota média no setor (partidas salvas). ▲▼ = fase nos últimos
            jogos. Linhas verdes = assistências entre os escalados.
          </p>
        </div>
        <TeamSheet view={view} />
      </div>

      {humans.length > 0 && (
        <section>
          <SectionHeading title="Plano de jogo" description="Arquétipo, pontos fortes e observação de cada vaga" />
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {humans.map((card) => (
              <SlotDetail key={card.slotIndex} card={card} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
