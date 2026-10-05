import type { Metadata } from "next";
import { after } from "next/server";

import { ClubHeader } from "@/components/clubs/ClubHeader";
import { ClubNav } from "@/components/clubs/ClubNav";
import { Container } from "@/components/layout/Container";
import { needsAutoSync, syncClubInBackground } from "@/services/sync/sync.service";

import { loadClub } from "./load-club";

export async function generateMetadata({
  params,
}: LayoutProps<"/clubs/[clubId]">): Promise<Metadata> {
  const { clubId } = await params;
  const club = await loadClub(clubId);
  return {
    title: {
      default: club.name,
      template: `%s · ${club.name} · FC Clubs Stats`,
    },
  };
}

export default async function ClubLayout({ children, params }: LayoutProps<"/clubs/[clubId]">) {
  const { clubId } = await params;
  const club = await loadClub(clubId);

  // A EA só guarda as 10 últimas partidas por tipo: quem abre o clube com dados
  // velhos já dispara a busca das novas, sem esperar a resposta.
  const autoSyncing = needsAutoSync(club);
  if (autoSyncing) after(() => syncClubInBackground(club));

  return (
    <Container className="space-y-6 pt-6 sm:pt-8">
      <ClubHeader club={club} autoSyncing={autoSyncing} />
      <ClubNav clubId={club.id} />
      {children}
    </Container>
  );
}
