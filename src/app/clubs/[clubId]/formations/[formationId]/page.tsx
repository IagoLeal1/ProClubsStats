import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FormationEditor } from "@/components/formations/FormationEditor";
import { BackLink } from "@/components/layout/BackLink";
import { getFormation } from "@/lib/db/formations.repository";
import { formatRelativeTime } from "@/lib/format";

import { isValidId, loadClub } from "../../load-club";
import { listEditorMembers } from "../editor-members";

const loadFormation = cache(async (clubId: string, formationId: string) => {
  const club = await loadClub(clubId);
  if (!isValidId(formationId)) notFound();
  const formation = await getFormation(club.id, formationId);
  if (!formation) notFound();
  return { club, formation };
});

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/formations/[formationId]">): Promise<Metadata> {
  const { clubId, formationId } = await params;
  const { formation } = await loadFormation(clubId, formationId);
  return { title: formation.name };
}

export default async function FormationPage({
  params,
}: PageProps<"/clubs/[clubId]/formations/[formationId]">) {
  const { clubId, formationId } = await params;
  const { club, formation } = await loadFormation(clubId, formationId);
  const members = await listEditorMembers(club.id, formation);

  return (
    <div className="space-y-6">
      <BackLink href={`/clubs/${club.id}/formations`}>Formações</BackLink>
      <div className="space-y-1">
        <h2 className="figure text-5xl break-words uppercase">{formation.name}</h2>
        <p className="text-sm text-muted-foreground">
          {formation.formationType} · atualizada {formatRelativeTime(formation.updatedAt)}
        </p>
      </div>
      <FormationEditor clubId={club.id} members={members} formation={formation} />
    </div>
  );
}
