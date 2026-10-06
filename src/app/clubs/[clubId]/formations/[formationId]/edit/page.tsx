import type { Metadata } from "next";

import { FormationEditor } from "@/components/formations/FormationEditor";
import { BackLink } from "@/components/layout/BackLink";
import { formatRelativeTime } from "@/lib/format";

import { listEditorMembers } from "../../editor-members";
import { loadFormation } from "../load-formation";

export async function generateMetadata({
  params,
}: PageProps<"/clubs/[clubId]/formations/[formationId]/edit">): Promise<Metadata> {
  const { clubId, formationId } = await params;
  const { formation } = await loadFormation(clubId, formationId);
  return { title: `Editar ${formation.name}` };
}

export default async function EditFormationPage({
  params,
}: PageProps<"/clubs/[clubId]/formations/[formationId]/edit">) {
  const { clubId, formationId } = await params;
  const { club, formation } = await loadFormation(clubId, formationId);
  const members = await listEditorMembers(club.id, formation);
  const viewHref = `/clubs/${club.id}/formations/${formation.id}`;

  return (
    <div className="space-y-6">
      <BackLink href={viewHref}>Escalação</BackLink>
      <div className="space-y-1">
        <span className="kicker text-primary">Editando</span>
        <h2 className="figure text-5xl break-words uppercase">{formation.name}</h2>
        <p className="text-sm text-muted-foreground">
          {formation.formationType} · atualizada {formatRelativeTime(formation.updatedAt)}
        </p>
      </div>
      <FormationEditor clubId={club.id} members={members} formation={formation} viewHref={viewHref} />
    </div>
  );
}
