import type { Metadata } from "next";

import { FormationEditor } from "@/components/formations/FormationEditor";
import { BackLink } from "@/components/layout/BackLink";

import { loadClub } from "../../load-club";
import { listEditorMembers } from "../editor-members";

export const metadata: Metadata = { title: "Nova formação" };

export default async function NewFormationPage({ params }: PageProps<"/clubs/[clubId]/formations/new">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const members = await listEditorMembers(club.id, null);

  return (
    <div className="space-y-6">
      <BackLink href={`/clubs/${club.id}/formations`}>Formações</BackLink>
      <h2 className="figure text-5xl uppercase">Nova formação</h2>
      <FormationEditor clubId={club.id} members={members} formation={null} />
    </div>
  );
}
