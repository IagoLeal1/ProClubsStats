import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { FormationEditor } from "@/components/formations/FormationEditor";
import { buttonVariants } from "@/components/ui/button";
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
      <Link
        href={`/clubs/${club.id}/formations`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
      >
        <ArrowLeftIcon data-icon="inline-start" /> Formações
      </Link>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{formation.name}</h2>
        <p className="text-xs text-muted-foreground">
          {formation.formationType} · atualizada {formatRelativeTime(formation.updatedAt)}
        </p>
      </div>
      <FormationEditor clubId={club.id} members={members} formation={formation} />
    </div>
  );
}
