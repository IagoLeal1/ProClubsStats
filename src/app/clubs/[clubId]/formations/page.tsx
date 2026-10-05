import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { FootballPitch } from "@/components/formations/FootballPitch";
import { FormationPlayer } from "@/components/formations/FormationPlayer";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listFormationsByClub } from "@/lib/db/formations.repository";
import { formatRelativeTime } from "@/lib/format";
import { findArchetype } from "@/lib/formations/archetypes";

import { loadClub } from "../load-club";

export const metadata: Metadata = { title: "Formações" };

export default async function ClubFormationsPage({ params }: PageProps<"/clubs/[clubId]/formations">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const formations = await listFormationsByClub(club.id);
  const newHref = `/clubs/${club.id}/formations/new`;

  return (
    <section className="space-y-6">
      <SectionHeading
        title="Formações do clube"
        description="Monte as escalações com arquétipo e pontos fortes de cada posição."
        action={
          formations.length > 0 && (
            <Link href={newHref} className={buttonVariants({ size: "sm" })}>
              <PlusIcon data-icon="inline-start" /> Nova formação
            </Link>
          )
        }
      />

      {formations.length === 0 ? (
        <div className="grid items-center gap-6 border border-dashed p-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <FootballPitch className="mx-auto max-w-64 opacity-60" />
          <div className="space-y-3">
            <p className="font-medium">Nenhuma formação ainda</p>
            <p className="text-sm text-muted-foreground">
              Escolha o esquema (4-3-3, 4-2-3-1, 3-5-2…), escale cada um na sua posição e defina
              o arquétipo do FC 27 e os pontos fortes — curva, passe curto, finalização — que vocês
              querem priorizar. Vagas sem ninguém ficam com a IA.
            </p>
            <Link href={newHref} className={buttonVariants()}>
              <PlusIcon data-icon="inline-start" /> Montar a primeira formação
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formations.map((formation) => (
            <li key={formation.id}>
              <Link
                href={`/clubs/${club.id}/formations/${formation.id}`}
                className="block space-y-3 border bg-card p-4 transition-colors hover:bg-surface"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl font-bold uppercase">{formation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Atualizada {formatRelativeTime(formation.updatedAt)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="tabular">
                    {formation.formationType}
                  </Badge>
                </div>
                <FootballPitch>
                  {formation.slots.map((slot) => (
                    <FormationPlayer
                      key={slot.slotIndex}
                      position={slot.position}
                      name={slot.playerName}
                      detail={findArchetype(slot.archetype)?.name}
                      x={slot.x}
                      y={slot.y}
                    />
                  ))}
                </FootballPitch>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
