import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { FormationEditor } from "@/components/formations/FormationEditor";
import { buttonVariants } from "@/components/ui/button";

import { loadClub } from "../../load-club";
import { listEditorMembers } from "../editor-members";

export const metadata: Metadata = { title: "Nova formação" };

export default async function NewFormationPage({ params }: PageProps<"/clubs/[clubId]/formations/new">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  const members = await listEditorMembers(club.id, null);

  return (
    <div className="space-y-6">
      <Link
        href={`/clubs/${club.id}/formations`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}
      >
        <ArrowLeftIcon data-icon="inline-start" /> Formações
      </Link>
      <h2 className="text-xl font-semibold tracking-tight">Nova formação</h2>
      <FormationEditor clubId={club.id} members={members} formation={null} />
    </div>
  );
}
